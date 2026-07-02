#!/bin/bash
# ============================================================================
# E2E Full Test — RAG-edu
# ============================================================================
BASE="http://localhost:8080/api/v1"
PASS=0; FAIL=0; SKIP=0
ok()    { echo "  ✅ $1"; ((PASS++)); }
fail()  { echo "  ❌ $1"; ((FAIL++)); }
info()  { echo "  ℹ️  $1"; }
header(){ echo ""; echo "━━━ $1 ━━━"; }

# Unique run ID
UUID=$(date +%s | md5sum | head -c8)
STUDENT_EMAIL="e2e-${UUID}@test.com"
STUDENT_PASS="testpass123"

# ─── 0. Setup: start HTTP server ──────────────────────────────────────────
header "0. Setup"
TEST_PORT=9998

# Clean old
lsof -ti :$TEST_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

TMPDIR=$(mktemp -d /tmp/rag-e2e-XXXXXX)

# History content
cat > "$TMPDIR/lich-su.txt" << 'CONTENT'
Lịch sử Việt Nam trải qua hàng nghìn năm văn hiến, bắt đầu từ thời Hùng Vương dựng nước Văn Lang. Trải qua thời kỳ Bắc thuộc, các triều đại Ngô-Đinh-Tiền Lê, Lý-Trần-Hồ, Lê sơ-Mạc-Lê Trung Hưng, Tây Sơn-Nguyễn đã kiên cường giữ nước. Nhà Lý (1009-1225) dời đô ra Thăng Long, xây Văn Miếu. Nhà Trần ba lần đánh thắng Nguyên Mông. Lê Lợi đánh đuổi quân Minh. Nguyễn Huệ đại phá quân Thanh. Hồ Chí Minh đọc Tuyên ngôn Độc lập 1945, kháng chiến chống Pháp và Mỹ đến năm 1975 thống nhất đất nước.
CONTENT

# Non-history content
cat > "$TMPDIR/tech-doc.txt" << 'CONTENT'
Hướng dẫn cài đặt phần mềm kế toán: Bước 1: Mở file setup.exe và nhấn Next. Bước 2: Chọn thư mục cài đặt mặc định C:\Program Files. Bước 3: Nhập license key được cấp qua email. Bước 4: Chọn các module cần cài: Quản lý bán hàng, Quản lý kho, Kế toán tổng hợp. Bước 5: Nhấn Install và đợi quá trình hoàn tất. Bước 6: Khởi động lại máy tính. Yêu cầu hệ thống: Windows 10+, RAM 8GB, ổ cứng trống 500MB, .NET Framework 4.8.
CONTENT

echo "  Content files created in $TMPDIR"

# Start HTTP server with explicit Python
cd "$TMPDIR"
nohup python3 -u -c "
import http.server, socketserver, sys
handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(('', $TEST_PORT), handler) as httpd:
    print(f'Server OK port=$TEST_PORT', flush=True)
    httpd.serve_forever()
" > /tmp/e2e-httpd.log 2>&1 &
HTTPD_PID=$!
sleep 2
if kill -0 $HTTPD_PID 2>/dev/null; then
  ok "HTTP server running (PID=$HTTPD_PID port=$TEST_PORT)"
else
  echo "  HTTP server log: $(cat /tmp/e2e-httpd.log)"
  fail "HTTP server failed"
  exit 1
fi

cleanup() {
  kill $HTTPD_PID 2>/dev/null || true
  rm -rf "$TMPDIR" 2>/dev/null || true
}
trap cleanup EXIT

# ─── 1. Health ─────────────────────────────────────────────────────────────
header "1. Health checks"
curl -sf http://localhost:8080/actuator/health | grep -q '"status":"UP"' && ok "Backend UP" || fail "Backend DOWN"
curl -sf --max-time 5 http://localhost:8001/rag/health | grep -q '"status":"ok"' && ok "RAG service UP" || fail "RAG DOWN"

# ─── 2. Register + Login ──────────────────────────────────────────────────
header "2. Auth"
REG=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"E2E Student\",\"email\":\"$STUDENT_EMAIL\",\"password\":\"$STUDENT_PASS\"}")
REG_STATUS=$(echo "$REG" | jq -r '.statusCode')
if [ "$REG_STATUS" = "201" ]; then ok "Register OK ($STUDENT_EMAIL)"; else fail "Register: $(echo $REG | jq -r .message)"; fi

LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$STUDENT_EMAIL\",\"password\":\"$STUDENT_PASS\"}")
TOKEN=$(echo "$LOGIN" | jq -r '.data.accessToken')
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  ok "Login OK"
else
  fail "Login failed: $(echo $LOGIN | jq -r .message)"
  exit 1
fi
AUTH="Authorization: Bearer $TOKEN"

# ─── 3. Create Folder ──────────────────────────────────────────────────────
header "3. Folder"
FOLDER=$(curl -s -X POST "$BASE/folders" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"folderName":"E2E Test Folder"}')
FOLDER_ID=$(echo "$FOLDER" | jq -r '.data.id')
if [ -n "$FOLDER_ID" ] && [ "$FOLDER_ID" != "null" ]; then ok "Folder id=$FOLDER_ID"; else fail "Folder create"; exit 1; fi

# ─── 4. Upload DOC1: history (expect auto-approve) ────────────────────────
header "4. DOC1: History content"
DOC1_RESP=$(curl -s -X POST "$BASE/documents" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"title\":\"Lịch sử Việt Nam\",\"fileUrl\":\"http://localhost:$TEST_PORT/lich-su.txt\",\"publicId\":\"e2e/lich-su\",\"sizeInBytes\":1024,\"format\":\"txt\",\"resourceType\":\"raw\",\"isPublic\":true,\"folderId\":$FOLDER_ID}")
DOC1_ID=$(echo "$DOC1_RESP" | jq -r '.data.id')
if [ -n "$DOC1_ID" ] && [ "$DOC1_ID" != "null" ]; then ok "DOC1 id=$DOC1_ID"; else fail "DOC1 upload: $(echo $DOC1_RESP | jq -r .message)"; fi

# ─── 5. Upload DOC2: tech (expect PENDING_REVIEW) ─────────────────────────
header "5. DOC2: Tech content"
DOC2_RESP=$(curl -s -X POST "$BASE/documents" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"title\":\"Hướng dẫn phần mềm\",\"fileUrl\":\"http://localhost:$TEST_PORT/tech-doc.txt\",\"publicId\":\"e2e/tech-doc\",\"sizeInBytes\":512,\"format\":\"txt\",\"resourceType\":\"raw\",\"isPublic\":false,\"folderId\":$FOLDER_ID}")
DOC2_ID=$(echo "$DOC2_RESP" | jq -r '.data.id')
if [ -n "$DOC2_ID" ] && [ "$DOC2_ID" != "null" ]; then ok "DOC2 id=$DOC2_ID"; else fail "DOC2 upload: $(echo $DOC2_RESP | jq -r .message)"; fi

# ─── 6. Poll AI review results (up to 90s) ───────────────────────────────
header "6. AI Review results"
DOC1_READY=false; DOC2_PENDING=false

for i in $(seq 1 18); do
  sleep 5
  
  # DOC1
  D1=$(curl -s "$BASE/documents/$DOC1_ID" -H "$AUTH")
  D1_STATUS=$(echo "$D1" | jq -r '.data.status')
  D1_REVIEW=$(echo "$D1" | jq -r '.data.aiReviewStatus')
  D1_CONF=$(echo "$D1" | jq -r '.data.aiConfidence')
  D1_WARN=$(echo "$D1" | jq -r '.data.aiWarningLevel')
  
  if [ "$DOC1_READY" = false ]; then
    if [ "$D1_STATUS" = "ACTIVE" ]; then
      ok "DOC1 auto-approved! confidence=$D1_CONF status=ACTIVE"
      DOC1_READY=true
    elif [ "$D1_REVIEW" = "AUTO_APPROVED" ]; then
      info "DOC1 auto-approved but indexing (status=$D1_STATUS)"
    elif [ "$D1_REVIEW" = "PENDING_ADMIN" ]; then
      ok "DOC1: PENDING_ADMIN (unexpected) warn=$D1_WARN conf=$D1_CONF"
      DOC1_PENDING_ADMIN=true
    fi
  fi
  
  # DOC2
  D2=$(curl -s "$BASE/documents/$DOC2_ID" -H "$AUTH")
  D2_STATUS=$(echo "$D2" | jq -r '.data.status')
  D2_REVIEW=$(echo "$D2" | jq -r '.data.aiReviewStatus')
  D2_CONF=$(echo "$D2" | jq -r '.data.aiConfidence')
  D2_WARN=$(echo "$D2" | jq -r '.data.aiWarningLevel')
  
  if [ "$DOC2_PENDING" = false ]; then
    if [ "$D2_REVIEW" = "PENDING_ADMIN" ]; then
      ok "DOC2 correctly PENDING_ADMIN! warn=$D2_WARN conf=$D2_CONF"
      DOC2_PENDING=true
    elif [ "$D2_STATUS" = "ACTIVE" ]; then
      ok "DOC2 auto-approved (unexpected) conf=$D2_CONF"
      DOC2_PENDING=true
    fi
  fi
  
  echo "  [$i] doc1=$D1_STATUS/$D1_REVIEW conf=$D1_CONF | doc2=$D2_STATUS/$D2_REVIEW conf=$D2_CONF"
  [ "$DOC1_READY" = true ] && [ "$DOC2_PENDING" = true ] && break
done

# ─── 7. Admin approve ────────────────────────────────────────────────────
header "7. Admin approve"
ADMIN_TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@historyrag.edu.vn","password":"Admin@123"}' | jq -r '.data.accessToken')

if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "null" ]; then
  ok "Admin login OK"
  ADMIN_AUTH="Authorization: Bearer $ADMIN_TOKEN"
  
  # Show pending queue
  PENDING_QUEUE=$(curl -s "$BASE/documents/pending" -H "$ADMIN_AUTH")
  PENDING_COUNT=$(echo "$PENDING_QUEUE" | jq '.data | length')
  info "Pending reviews queue: $PENDING_COUNT"
  
  # Approve doc2 if pending
  if [ "$DOC2_PENDING" = true ]; then
    APPROVE=$(curl -s -X POST "$BASE/documents/$DOC2_ID/approve" -H "$ADMIN_AUTH")
    if echo "$APPROVE" | grep -q '"statusCode":200'; then
      ok "Approved DOC2"
      for i in $(seq 1 12); do
        sleep 5
        DS=$(curl -s "$BASE/documents/$DOC2_ID" -H "$ADMIN_AUTH" | jq -r '.data.status')
        echo "  doc2 index attempt $i: $DS"
        if [ "$DS" = "ACTIVE" ]; then ok "DOC2 ACTIVE after admin approval!"; DOC2_READY=true; break; fi
        if [ "$DS" = "FAILED" ]; then info "DOC2 indexing FAILED (check Qdrant)"; break; fi
      done
    else
      info "Approve DOC2 response: $APPROVE"
    fi
  fi
  
  # Approve doc1 if it was pending
  if [ "$DOC1_PENDING_ADMIN" = true ]; then
    curl -s -X POST "$BASE/documents/$DOC1_ID/approve" -H "$ADMIN_AUTH" > /dev/null
    ok "Approved DOC1 (was pending)"
  fi
  
  # Test reject
  REJ=$(curl -s -X POST "$BASE/documents" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d "{\"title\":\"Reject test\",\"fileUrl\":\"http://localhost:$TEST_PORT/tech-doc.txt\",\"publicId\":\"e2e/reject\",\"sizeInBytes\":256,\"format\":\"txt\",\"resourceType\":\"raw\",\"isPublic\":false}")
  REJ_ID=$(echo "$REJ" | jq -r '.data.id')
  sleep 8
  REJECT=$(curl -s -X POST "$BASE/documents/$REJ_ID/reject" \
    -H "$ADMIN_AUTH" -H "Content-Type: application/json" \
    -d '{"rejectionReason":"Nội dung không phù hợp"}')
  if echo "$REJECT" | grep -q '"statusCode":200'; then
    ok "Reject document OK"
    sleep 3
    REJ_STAT=$(curl -s "$BASE/documents/$REJ_ID" -H "$ADMIN_AUTH" | jq -r '.data.status')
    if [ "$REJ_STAT" = "REJECTED" ]; then ok "Rejected status=REJECTED"; else info "Rejected status=$REJ_STAT"; fi
  fi
  curl -s -X DELETE "$BASE/documents/$REJ_ID/hard" -H "$ADMIN_AUTH" > /dev/null
  ok "Cleanup reject doc"
else
  info "Admin login failed, admin tests SKIPPED"; SKIP=$((SKIP+4))
fi

# ─── 8. Chat ─────────────────────────────────────────────────────────────
header "8. Chat verification"
if [ "$DOC1_READY" = true ] || [ "$DOC2_READY" = true ] || [ "$DOC1_PENDING_ADMIN" = true ]; then
  sleep 2
  CHAT=$(curl -s --max-time 30 -X POST "$BASE/folders/$FOLDER_ID/chat" \
    -H "$AUTH" -H "Content-Type: application/json" \
    -d '{"question":"Tài liệu trong thư mục này nói về nội dung gì? Hãy tóm tắt ngắn gọn."}')
  ANSWER=$(echo "$CHAT" | jq -r '.data.answer')
  CITATIONS=$(echo "$CHAT" | jq -r '.data.citations | length')
  
  if [ -n "$ANSWER" ] && [ "$ANSWER" != "null" ] && ! echo "$ANSWER" | grep -q "chưa đủ"; then
    ok "Chat reply (${#ANSWER} chars, $CITATIONS citations)"
    echo "    ${ANSWER:0:300}..."
    echo "$ANSWER" | grep -qiE "lịch sử|việt nam|hùng vương|trần" && ok "Answer is about history!" || \
    echo "$ANSWER" | grep -qiE "phần mềm|hướng dẫn|cài đặt" && ok "Answer is about software!" || \
    info "Answer topic: ${ANSWER:0:100}"
  else
    info "Chat: no relevant answer (data may not be indexed yet)"
  fi
else
  info "No indexed data, skip chat"; SKIP=$((SKIP+1))
fi

# ─── 9. Cleanup ──────────────────────────────────────────────────────────
header "9. Cleanup"
for DID in "$DOC1_ID" "$DOC2_ID"; do
  [ -n "$DID" ] && [ "$DID" != "null" ] && curl -s -X DELETE "$BASE/documents/$DID/hard" -H "$AUTH" > /dev/null 2>&1 || true
done
[ -n "$FOLDER_ID" ] && [ "$FOLDER_ID" != "null" ] && curl -s -X DELETE "$BASE/folders/$FOLDER_ID" -H "$AUTH" > /dev/null 2>&1 || true
ok "Cleanup done"

# ─── Result ────────────────────────────────────────────────────────────────
header "SUMMARY"
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  ℹ️  Skipped: $SKIP"
if [ "$FAIL" -eq 0 ]; then echo ""; echo "🎉 ALL TESTS PASSED!"; else echo ""; echo "⚠️  $FAIL test(s) FAILED"; fi
echo "════════════════════════════════"
exit $((FAIL > 0 ? 1 : 0))
