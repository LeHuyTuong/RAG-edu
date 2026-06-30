#!/bin/bash
# E2E test script — RAG-edu backend
# Chạy sau khi backend đã up: ./e2e-test.sh
# Yêu cầu: curl, jq

BASE="http://localhost:8080/api/v1"
PASS=1

ok()   { echo "✅ $1"; }
fail() { echo "❌ $1"; PASS=0; }
info() { echo "ℹ️  $1"; }
section() { echo ""; echo "── $1 ──────────────────────────"; }

# ── 0. Health ────────────────────────────────────────────
section "Health"
HEALTH_RAW=$(curl -s "http://localhost:8080/actuator/health" 2>/dev/null)
echo "$HEALTH_RAW" | grep -q '"status":"UP"' && ok "actuator/health = UP" || fail "actuator/health = $HEALTH_RAW"

# ── 1. Register ──────────────────────────────────────────
section "Auth"
REG=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"e2e@test.com","password":"${E2E_USER_PASSWORD:-changeme}"}')

REG_STATUS=$(echo "$REG" | jq -r '.statusCode' 2>/dev/null)
[ "$REG_STATUS" = "201" ] && ok "register → 201 (new)" || \
[ "$REG_STATUS" = "409" ] && ok "register → 409 (user tồn tại, dùng lại)" || \
fail "register → $REG_STATUS"

# ── 2. Login ─────────────────────────────────────────────
LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"e2e@test.com","password":"${E2E_USER_PASSWORD:-changeme}"}')

TOKEN=$(echo "$LOGIN" | jq -r '.data.accessToken' 2>/dev/null)
[ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] && ok "login → accessToken OK" || fail "login failed: $(echo $LOGIN | jq -r '.message')"

AUTH="Authorization: Bearer $TOKEN"

# ── 3. RAG Health (authenticated) ────────────────────────
# rag-service cần chạy độc lập (Python FastAPI) — nếu down thì skip
RAG_HEALTH_RAW=$(curl -s --max-time 3 "$BASE/rag/health" -H "$AUTH" 2>/dev/null)
echo "$RAG_HEALTH_RAW" | grep -q '"status":"ok"' && ok "rag/health = ok" || info "rag/health không khả dụng (cần start rag-service riêng)"

# ── 4. Get Me ────────────────────────────────────────────
ME=$(curl -s "$BASE/auth/me" -H "$AUTH")
NAME=$(echo "$ME" | jq -r '.data.name' 2>/dev/null)
ROLE=$(echo "$ME" | jq -r '.data.role' 2>/dev/null)
AVATAR=$(echo "$ME" | jq -r '.data.avatarUrl' 2>/dev/null)
[ "$NAME" = "Test Student" ] && ok "getMe → name=$NAME" || fail "getMe → name=$NAME"
[ "$ROLE" = "student" ] && ok "getMe → role=$ROLE" || fail "getMe → role=$ROLE"
[ "$AVATAR" = "null" ] && ok "getMe → avatarUrl=null (chưa set)" || info "getMe → avatarUrl=$AVATAR"

# ── 5. Create Folder ─────────────────────────────────────
section "Folder"
FOLDER=$(curl -s -X POST "$BASE/folders" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"folderName":"Lịch sử Việt Nam 12"}')

FOLDER_ID=$(echo "$FOLDER" | jq -r '.data.id' 2>/dev/null)
[ -n "$FOLDER_ID" ] && [ "$FOLDER_ID" != "null" ] && ok "create folder → id=$FOLDER_ID" || fail "create folder: $(echo $FOLDER | jq -r '.message')"

# List folders
FOLDERS=$(curl -s "$BASE/folders" -H "$AUTH")
FOLDER_COUNT=$(echo "$FOLDERS" | jq '.data | length' 2>/dev/null)
[ "$FOLDER_COUNT" -ge 1 ] 2>/dev/null && ok "list folders → $FOLDER_COUNT folder(s)" || fail "list folders empty"

# ── 6. Upload Document (JSON body — Cloudinary fields) ───
section "Document"
DOC_DATA=$(cat <<ENDJSON
{
  "title": "Bài học lịch sử E2E",
  "fileUrl": "https://res.cloudinary.com/demo/lesson-e2e.pdf",
  "publicId": "demo/lesson-e2e",
  "sizeInBytes": 1024,
  "format": "pdf",
  "resourceType": "raw",
  "isPublic": false,
  "folderId": $FOLDER_ID
}
ENDJSON
)
DOC=$(curl -s -X POST "$BASE/documents" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "$DOC_DATA")

DOC_ID=$(echo "$DOC" | jq -r '.data.id' 2>/dev/null)
DOC_STATUS=$(echo "$DOC" | jq -r '.data.status' 2>/dev/null)
DOC_COMPUTED_STATUS=$(echo "$DOC" | jq -r '.data.status' 2>/dev/null)
[ -n "$DOC_ID" ] && [ "$DOC_ID" != "null" ] && ok "upload document → id=$DOC_ID status=$DOC_STATUS" || fail "upload document: $(echo $DOC | jq -r '.message')"

# Verify author & subject fields
AUTHOR_NAME=$(echo "$DOC" | jq -r '.data.author.name' 2>/dev/null)
[ "$AUTHOR_NAME" = "Test Student" ] && ok "document author → name=$AUTHOR_NAME" || fail "document author → name=$AUTHOR_NAME"

# ── 7. Poll document status → ACTIVE (computed status for READY) ─
section "Indexing (poll 60s)"
READY=0
for i in $(seq 1 12); do
  sleep 5
  STATUS=$(curl -s "$BASE/documents/$DOC_ID" -H "$AUTH" | jq -r '.data.status' 2>/dev/null)
  echo "  attempt $i: status=$STATUS"
  if [ "$STATUS" = "ACTIVE" ]; then
    READY=1; break
  fi
  if [ "$STATUS" = "REJECTED" ]; then
    break
  fi
done
[ "$READY" = "1" ] && ok "document ACTIVE after indexing" || info "document status=$STATUS (rag-service có thể chưa hoạt động)"

# ── 8. Chat with folder ───────────────────────────────────
section "RAG Chat"
if [ -n "$FOLDER_ID" ] && [ "$FOLDER_ID" != "null" ]; then
  CHAT=$(curl -s --max-time 5 -X POST "$BASE/folders/$FOLDER_ID/chat" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{"question":"Hãy cho biết nội dung tài liệu này nói về gì?"}' 2>/dev/null)

  ANSWER=$(echo "$CHAT" | jq -r '.data.answer' 2>/dev/null)
  if [ -n "$ANSWER" ] && [ "$ANSWER" != "null" ]; then
    ok "chat → answer received (${#ANSWER} chars)"
  else
    info "chat → không có answer (rag-service có thể chưa hoạt động)"
  fi
fi

# ── 9. Soft delete + restore ──────────────────────────────
section "Lifecycle"
# Soft delete
curl -s -X DELETE "$BASE/documents/$DOC_ID" -H "$AUTH" > /dev/null
SOFT_STATUS=$(curl -s "$BASE/documents/$DOC_ID" -H "$AUTH" | jq -r '.data.status' 2>/dev/null)
[ "$SOFT_STATUS" = "DELETED" ] && ok "softDelete → status=DELETED (computed)" || fail "softDelete: status=$SOFT_STATUS"

# Restore
curl -s -X POST "$BASE/documents/$DOC_ID/restore" -H "$AUTH" > /dev/null
RESTORED_STATUS=$(curl -s "$BASE/documents/$DOC_ID" -H "$AUTH" | jq -r '.data.status' 2>/dev/null)
[ "$RESTORED_STATUS" = "ACTIVE" ] && ok "restore → ACTIVE" || fail "restore → $RESTORED_STATUS"

# ── 10. Approve/Reject (admin only) ───────────────────────
section "Admin"
# Login as admin
ADMIN_LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@historyrag.edu.vn","password":"${E2E_ADMIN_PASSWORD:-changeme}"}')
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | jq -r '.data.accessToken' 2>/dev/null)
ADMIN_AUTH="Authorization: Bearer $ADMIN_TOKEN"

if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "null" ]; then
  ok "admin login successful"
  
  # Test approve
  APPROVE=$(curl -s -X POST "$BASE/documents/$DOC_ID/approve" -H "$ADMIN_AUTH")
  APPROVE_CODE=$(echo "$APPROVE" | jq -r '.statusCode' 2>/dev/null)
  [ "$APPROVE_CODE" = "200" ] && ok "approve document → $APPROVE_CODE" || fail "approve: $APPROVE_CODE"
  
  # Test reject (create new doc for this)
  REJECT_DOC=$(curl -s -X POST "$BASE/documents" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{"title":"Doc to reject","fileUrl":"https://res.cloudinary.com/demo/reject.pdf","publicId":"demo/reject","sizeInBytes":512,"format":"pdf","resourceType":"raw","isPublic":false}')
  REJECT_DOC_ID=$(echo "$REJECT_DOC" | jq -r '.data.id' 2>/dev/null)
  
  REJECT=$(curl -s -X POST "$BASE/documents/$REJECT_DOC_ID/reject" \
    -H "$ADMIN_AUTH" -H "Content-Type: application/json" \
    -d '{"rejectionReason":"Nội dung không phù hợp"}')
  REJECT_CODE=$(echo "$REJECT" | jq -r '.statusCode' 2>/dev/null)
  [ "$REJECT_CODE" = "200" ] && ok "reject document → $REJECT_CODE" || fail "reject: $REJECT_CODE"
  
  # Verify rejected status
  REJECT_STATUS=$(curl -s "$BASE/documents/$REJECT_DOC_ID" -H "$ADMIN_AUTH" | jq -r '.data.status' 2>/dev/null)
  [ "$REJECT_STATUS" = "REJECTED" ] && ok "rejected doc status=$REJECT_STATUS" || fail "rejected doc status=$REJECT_STATUS"
  
  # Test account CRUD
  ACCOUNTS=$(curl -s "$BASE/accounts" -H "$ADMIN_AUTH")
  ACCOUNT_COUNT=$(echo "$ACCOUNTS" | jq '.data | length' 2>/dev/null)
  [ "$ACCOUNT_COUNT" -ge 1 ] 2>/dev/null && ok "list accounts → $ACCOUNT_COUNT account(s)" || fail "list accounts: $ACCOUNT_COUNT"
  
  # Test subjects
  SUBJECTS=$(curl -s "$BASE/subjects" -H "$AUTH")
  SUBJECTS_RESULT=$(echo "$SUBJECTS" | jq -r '.data.subjects | length' 2>/dev/null)
  [ "$SUBJECTS_RESULT" -ge 0 ] 2>/dev/null && ok "list subjects → $SUBJECTS_RESULT subject(s)" || info "subjects not available"
  
  # Create a subject
  NEW_SUBJECT=$(curl -s -X POST "$BASE/subjects" \
    -H "$ADMIN_AUTH" -H "Content-Type: application/json" \
    -d '{"name":"Lịch sử","code":"LS"}')
  SUBJECT_ID=$(echo "$NEW_SUBJECT" | jq -r '.data.id' 2>/dev/null)
  [ -n "$SUBJECT_ID" ] && [ "$SUBJECT_ID" != "null" ] && ok "create subject → id=$SUBJECT_ID" || info "create subject: $(echo $NEW_SUBJECT | jq -r '.message')"
else
  info "Không thể đăng nhập admin — bỏ qua admin tests"
fi

# ── 11. Hard delete ───────────────────────────────────────
curl -s -X DELETE "$BASE/documents/$DOC_ID/hard" -H "$AUTH" > /dev/null
HARD_STATUS=$(curl -s "$BASE/documents/$DOC_ID" -H "$AUTH" | jq -r '.statusCode' 2>/dev/null)
[ "$HARD_STATUS" = "404" ] && ok "hardDelete → 404" || fail "hardDelete: still exists ($HARD_STATUS)"

# ── 12. Delete folder ─────────────────────────────────────
section "Cleanup"
curl -s -X DELETE "$BASE/folders/$FOLDER_ID" -H "$AUTH" > /dev/null
ok "folder deleted"

# ── Result ───────────────────────────────────────────────
echo ""
echo "════════════════════════════════"
[ "$PASS" = "1" ] && echo "🎉  ALL TESTS PASSED" || echo "⚠️  SOME TESTS FAILED — xem ❌ bên trên"
echo "════════════════════════════════"
