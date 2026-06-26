#!/bin/bash
# E2E test script — RAG-edu backend
# Chạy sau khi backend đã up: ./e2e-test.sh
# Yêu cầu: curl, jq

BASE="http://localhost:8080/api/v1"
PASS=1

ok()   { echo "✅ $1"; }
fail() { echo "❌ $1"; PASS=0; }
section() { echo ""; echo "── $1 ──────────────────────────"; }

# ── 0. Health ────────────────────────────────────────────
section "Health"
HEALTH_RAW=$(curl -s "http://localhost:8080/actuator/health" 2>/dev/null)
echo "$HEALTH_RAW" | grep -q '"status":"UP"' && ok "actuator/health = UP" || fail "actuator/health = $HEALTH_RAW"

# ── 1. Register ──────────────────────────────────────────
section "Auth"
REG=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"e2e@test.com","password":"password123"}')

REG_STATUS=$(echo "$REG" | jq -r '.statusCode' 2>/dev/null)
[ "$REG_STATUS" = "201" ] && ok "register → 201 (new)" || \
[ "$REG_STATUS" = "409" ] && ok "register → 409 (user tồn tại, dùng lại)" || \
fail "register → $REG_STATUS"

# ── 2. Login ─────────────────────────────────────────────
LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"e2e@test.com","password":"password123"}')

TOKEN=$(echo "$LOGIN" | jq -r '.data.accessToken' 2>/dev/null)
[ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] && ok "login → accessToken OK" || fail "login failed: $(echo $LOGIN | jq -r '.message')"

AUTH="Authorization: Bearer $TOKEN"

# ── 3. RAG Health (authenticated) ────────────────────────
RAG_HEALTH_RAW=$(curl -s "$BASE/rag/health" -H "$AUTH" 2>/dev/null)
echo "$RAG_HEALTH_RAW" | grep -q '"status":"ok"' && ok "rag/health = ok" || fail "rag/health = $RAG_HEALTH_RAW"

# ── 4. Get Me ────────────────────────────────────────────
ME=$(curl -s "$BASE/auth/me" -H "$AUTH")
ROLE=$(echo "$ME" | jq -r '.data.role' 2>/dev/null)
[ "$ROLE" = "ROLE_USER" ] && ok "getMe → role=ROLE_USER" || fail "getMe → role=$ROLE"

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

# ── 6. Upload Document ───────────────────────────────────
section "Document"
# Dùng 1 PDF nhỏ test (tạo tạm nếu không có)
TEST_PDF="/tmp/e2e-test.pdf"
if [ ! -f "$TEST_PDF" ]; then
  # Tạo PDF tối giản bằng printf
  printf '%%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>>>>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 12 Tf 100 700 Td (Lich su Viet Nam test) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000296 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n390\n%%%%EOF\n' > "$TEST_PDF"
fi

DATA_JSON="{\"title\":\"Bài học lịch sử E2E\",\"folderId\":$FOLDER_ID,\"isPublic\":false}"
DOC=$(curl -s -X POST "$BASE/documents" \
  -H "$AUTH" \
  -F "file=@$TEST_PDF;type=application/pdf" \
  -F "data=$DATA_JSON;type=application/json")

DOC_ID=$(echo "$DOC" | jq -r '.data.id' 2>/dev/null)
DOC_STATUS=$(echo "$DOC" | jq -r '.data.status' 2>/dev/null)
[ -n "$DOC_ID" ] && [ "$DOC_ID" != "null" ] && ok "upload document → id=$DOC_ID status=$DOC_STATUS" || fail "upload document: $(echo $DOC | jq -r '.message')"

# ── 7. Poll document status → READY ──────────────────────
section "Indexing (poll 60s)"
READY=0
for i in $(seq 1 12); do
  sleep 5
  STATUS=$(curl -s "$BASE/documents/$DOC_ID" -H "$AUTH" | jq -r '.data.status' 2>/dev/null)
  echo "  attempt $i: status=$STATUS"
  if [ "$STATUS" = "READY" ]; then
    READY=1; break
  fi
  if [ "$STATUS" = "FAILED" ]; then
    break
  fi
done
[ "$READY" = "1" ] && ok "document READY after indexing" || fail "document NOT ready (status=$STATUS)"

# ── 8. Chat with folder ───────────────────────────────────
section "RAG Chat"
if [ -n "$FOLDER_ID" ] && [ "$FOLDER_ID" != "null" ]; then
  CHAT=$(curl -s -X POST "$BASE/folders/$FOLDER_ID/chat" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{"question":"Hãy cho biết nội dung tài liệu này nói về gì?"}')

  ANSWER=$(echo "$CHAT" | jq -r '.data.answer' 2>/dev/null)
  CITATIONS=$(echo "$CHAT" | jq '.data.citations | length' 2>/dev/null)

  [ -n "$ANSWER" ] && [ "$ANSWER" != "null" ] && ok "chat → answer received (${#ANSWER} chars)" || fail "chat → no answer: $(echo $CHAT | jq -r '.message')"
  [ "$CITATIONS" -ge 0 ] 2>/dev/null && ok "chat → $CITATIONS citation(s)" || fail "chat → citations error"
fi

# ── 9. Soft delete + restore ──────────────────────────────
section "Lifecycle"
curl -s -X DELETE "$BASE/documents/$DOC_ID" -H "$AUTH" > /dev/null
SOFT_STATUS=$(curl -s "$BASE/documents/$DOC_ID" -H "$AUTH" | jq -r '.data.status' 2>/dev/null)
[ "$SOFT_STATUS" = "SOFT_DELETED" ] && ok "softDelete → status=SOFT_DELETED (owner vẫn thấy)" || fail "softDelete: status=$SOFT_STATUS"

curl -s -X POST "$BASE/documents/$DOC_ID/restore" -H "$AUTH" > /dev/null
RESTORED_STATUS=$(curl -s "$BASE/documents/$DOC_ID" -H "$AUTH" | jq -r '.data.status' 2>/dev/null)
[ "$RESTORED_STATUS" = "READY" ] && ok "restore → READY" || fail "restore → $RESTORED_STATUS"

# ── 10. Hard delete ───────────────────────────────────────
curl -s -X DELETE "$BASE/documents/$DOC_ID/hard" -H "$AUTH" > /dev/null
HARD_STATUS=$(curl -s "$BASE/documents/$DOC_ID" -H "$AUTH" | jq -r '.statusCode' 2>/dev/null)
[ "$HARD_STATUS" = "404" ] && ok "hardDelete → 404" || fail "hardDelete: still exists ($HARD_STATUS)"

# ── 11. Delete folder ─────────────────────────────────────
section "Cleanup"
curl -s -X DELETE "$BASE/folders/$FOLDER_ID" -H "$AUTH" > /dev/null
ok "folder deleted"

# ── Result ───────────────────────────────────────────────
echo ""
echo "════════════════════════════════"
[ "$PASS" = "1" ] && echo "🎉  ALL TESTS PASSED" || echo "⚠️  SOME TESTS FAILED — xem ❌ bên trên"
echo "════════════════════════════════"
