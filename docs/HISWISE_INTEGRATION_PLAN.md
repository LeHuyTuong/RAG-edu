# HisWise — Plan tích hợp Backend (Java Spring Boot) + RAG Service vào RAG-edu

> Trạng thái: **Draft / để review**. Tài liệu này đánh giá hiện trạng và đề ra lộ trình chỉnh sửa frontend + backend cho khớp System Design (HisWise).

---

## 1. Bối cảnh (Context)

RAG-edu hiện **không phải chỉ có frontend**. Thực tế repo đang có:

| Phần         | Hiện trạng                                                                                                                                                                                                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`   | **Next.js 16 (App Router) + React 19 + shadcn + Tailwind v4 + Zustand + axios**. Đã build: auth, browse/library, search/filter, preview (PDF/DOCX/TXT/image), my-documents, upload (client → Cloudinary), admin dashboard, moderator. **Thiếu: Ask-AI/chat UI, Folders, Admin Settings thật.** |
| `apps/api`   | **NestJS 11 + Prisma + MongoDB** đầy đủ auth/documents/admin — nhưng **0% code AI/RAG**. → **Sẽ bị thay thế** (quyết định bên dưới).                                                                                                                                                           |
| `packages/*` | `@repo/ui`, `@repo/tokens`, eslint/ts config — giữ nguyên.                                                                                                                                                                                                                                     |

Nguồn để tích hợp — **RAG-history** (`/Users/lehuytuong/Documents/Dev/RAG-history`):

| Phần           | Stack                                                                      | Vai trò                                                                                                                                               |
| -------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/`     | **Java Spring Boot 4, Java 25, MySQL + Flyway, JWT (HS512), WebClient**    | Auth + **proxy** sang rag-service. **Chưa có**: upload file, Folder, document-status lifecycle.                                                       |
| `rag-service/` | **Python FastAPI + Qdrant + Google GenAI (Gemini embeddings + Gemma LLM)** | Engine RAG hoàn chỉnh: extract → chunk → embed → Qdrant; query → retrieve → LLM → citations. **Domain-agnostic** (chỉ vài chỗ hardcode "lịch sử VN"). |

### Quyết định kiến trúc đã chốt

1. **Backend = Java Spring Boot** (port từ RAG-history sang domain education), **bỏ `apps/api` NestJS**. → khớp **package diagram** HisWise (Controller/Service/ServiceImpl/Repository/Dto/Entity).
2. **DB = MongoDB** (Spring Data MongoDB) — **không dùng MySQL**. ⚠️ Đánh đổi: backend RAG-history viết trên JPA/MySQL/Flyway nên phải **viết lại tầng persistence** (xem §3.1); phần auth/security/WebClient/controllers vẫn tái dùng được.
3. **Vector store = Qdrant** (giữ nguyên của rag-service). Chunk metadata lưu Mongo, vector lưu Qdrant qua `qdrantPointId`. (Có thể **không lưu `content` chunk trong Mongo** vì Qdrant payload đã có → Mongo cực nhẹ.)
4. **Thêm Folder model** (user sở hữu) — đơn vị scope cho "Ask AI".
5. **Quy trình diagram**: **code trước, vẽ Class/Sequence Diagram sau** dựa trên code thật (xem Phase 7).

### Kết quả mong đợi

Một hệ thống chạy đúng theo deployment diagram: **FE (Next.js) ↔ BE (Spring Boot) ↔ DB (MongoDB)**, third-party = **Cloud Storage (Cloudinary)** + **AI Service (rag-service + Qdrant + Gemini)**; đầy đủ các use case HisWise gồm cả **Ask AI about document (có citation + số trang)**.

---

## 2. Kiến trúc đích (khớp Deployment Diagram)

```
                 HisWise
┌─────────────────────────────────────────────┐        Third Party
│  apps/web (Next.js)  ──HTTP──►  backend/      │   ┌──────────────────────┐
│   (FE)                          (Spring Boot) │   │ Cloudinary (storage) │
│                                  │      │     │   │ rag-service (Python) │
│                                  │mongo │     │   │   └► Qdrant + Gemini  │
│                                  ▼      └─HTTP─┼──►│                      │
│                              MongoDB          │   └──────────────────────┘
└─────────────────────────────────────────────┘
```

### Bố cục monorepo sau khi đổi

- Giữ: `apps/web`, `packages/*`.
- **Thêm** (đặt ở **root**, không nằm trong glob `apps/*` của pnpm để tránh xung đột workspace):
  - `backend/` — copy & adapt từ `RAG-history/backend`.
  - `rag-service/` — copy & adapt từ `RAG-history/rag-service`.
- **Bỏ**: `apps/api` (NestJS) — archive lại branch/tag trước khi xoá.
- Cập nhật `docker-compose.yaml` (root): `web`, `backend`, `rag-service`, `mongo` (standalone, không cần replica set), `qdrant`. (Bỏ `redis` trừ khi cần queue cho indexing async.)

---

## 3. Data Model (khớp Class Diagram)

### 3.1. Đổi tầng persistence JPA → MongoDB (do chọn Mongo)

- `spring-boot-starter-data-jpa` + MySQL driver + Flyway → **`spring-boot-starter-data-mongodb`**.
- `@Entity`/`@Table` → **`@Document`**; `@Id Long` (auto-increment) → **`@Id String`** (ObjectId).
- Quan hệ FK → **reference (`@DBRef` hoặc lưu id thủ công)** hoặc **embedded** (vd. nhúng `List<Chunk>` vào `Document` nếu muốn). Khuyến nghị: tham chiếu bằng id (`ownerId`, `folderId`, `documentId`) cho đơn giản.
- `JpaRepository` → **`MongoRepository`** (query method giữ gần như nguyên).
- **Bỏ Flyway** (Mongo schemaless) → seed `Config` mặc định bằng `CommandLineRunner` hoặc `ApplicationRunner`.
- Audit `BaseEntity.createdAt/updatedAt` → **`@CreatedDate`/`@LastModifiedDate`** + `@EnableMongoAuditing`.
- Vẫn **tái dùng**: `config/SecurityConfig`, `JwtConfig`, `feature/auth/*` (logic), `infrastructure/webclient/*`, `feature/rag/dto/*`, `ApiResponse`, `GlobalExceptionHandler`.

> Backend RAG-history tách user thành 2 bảng `admin`/`member`. **Khuyến nghị gộp về 1 collection `users` + field `role`** cho khớp class diagram (User → Student/Admin) và đơn giản hơn.

| Entity                    | Field chính                                                                                                                   | Ghi chú so với RAG-history                                                                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**                  | `userId, username, email, passwordHash, role(STUDENT/ADMIN), status`                                                          | Gộp 2 bảng admin/member → 1 bảng. `AuthAccount` record có thể bỏ.                                                                                                                                       |
| **Folder**                | `folderId, folderName, ownerId(→User)`                                                                                        | **MỚI** — RAG-history không có Folder.                                                                                                                                                                  |
| **Document**              | `docId, title, fileUrl, publicId, sizeInBytes, format, status(DocumentStatus), uploadedAt, folderId(→Folder), ownerId(→User)` | RAG-history dùng `Source` (không có status/folder/upload). Tạo entity `Document` mới.                                                                                                                   |
| **DocumentStatus** (enum) | `UPLOADING, INDEXING, REINDEXING, READY, FAILED, SOFT_DELETED`                                                                | **MỚI** — khớp State Diagram.                                                                                                                                                                           |
| **Chunk**                 | `chunkId, content, documentId, chunkIndex, pageNumber, qdrantPointId, contentHash`                                            | Bám pattern bảng `rag_chunk` đã có trong `V1__init.sql`. `embedding:float[]` ở class diagram → thực tế lưu trong Qdrant, MySQL chỉ giữ `qdrantPointId`.                                                 |
| **Citation**              | `documentId, pageNumber, snippet`                                                                                             | rag-service đã trả `pageNumber` + `chunkText`; cần **thêm `snippet`** (xem §5).                                                                                                                         |
| **AnswerWithCitation**    | `answerText, citations: List<Citation>`                                                                                       | = `RagChatResponse` (answer + citations).                                                                                                                                                               |
| **Config**                | `allowedType: List<String>, maxSizeMB: int`                                                                                   | Collection `config`/`system_settings` (key/value hoặc 1 document config). RAG-history seed sẵn `rag.chunk_size`, `rag.top_k`, `rag.embedding_model`… Thêm `upload.allowed_types`, `upload.max_size_mb`. |

**Seed dữ liệu mặc định**: không dùng Flyway nữa → seed `Config` mặc định bằng `CommandLineRunner`. (Tham khảo các giá trị seed trong `RAG-history/backend/src/main/resources/db/migration/V1__init.sql` — bảng `system_settings` — để lấy default RAG params.)

---

## 4. API Backend (khớp Use Case Diagram)

Base path `/api/v1`, envelope `ApiResponse<T>` = `{ statusCode, message, data, error, details }`.

| Use case          | Endpoint                                                                                                              | Có sẵn ở RAG-history?                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Register / Login  | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`                                 | ✅ Có (chỉ sửa user-model 1 bảng).                                                                      |
| Manage folders    | `POST /folders`, `GET /folders`, `PUT /folders/{id}`, `DELETE /folders/{id}`                                          | ❌ **Xây mới.**                                                                                         |
| Upload document   | `POST /documents` (nhận metadata sau khi FE upload Cloudinary)                                                        | ❌ **Xây mới** (RAG-history không upload).                                                              |
| List / Search     | `GET /documents?folderId&search&status&page&limit`                                                                    | ❌ Xây mới (RAG-history không list documents).                                                          |
| Preview           | `GET /documents/{id}` (trả `fileUrl` để FE render)                                                                    | ❌ Xây mới.                                                                                             |
| Edit / Delete     | `PUT /documents/{id}`, `DELETE /documents/{id}` (soft), `DELETE /documents/{id}/hard`, `POST /documents/{id}/restore` | ❌ Xây mới (theo State Diagram).                                                                        |
| Re-index          | `POST /documents/{id}/reindex`                                                                                        | Proxy lại `/ingest`.                                                                                    |
| **Ask AI**        | `POST /chat` (body: `folderId, question, topK`) → AnswerWithCitation; `POST /chat/stream` (SSE)                       | ✅ Có `RagController` — **thêm filter `folderId`**.                                                     |
| Admin: config     | `GET /admin/config`, `PUT /admin/config`                                                                              | ⚠️ Có `system_settings` table, **chưa có controller** → xây CRUD + `@PreAuthorize("hasRole('ADMIN')")`. |
| Admin: doc stats  | `GET /admin/stats/documents`                                                                                          | ⚠️ Có `AdminDashboardController` — mở rộng.                                                             |
| Admin: user stats | `GET /admin/stats/users`                                                                                              | ⚠️ Mở rộng dashboard.                                                                                   |

**Tái dùng nguyên trạng**: `infrastructure/webclient/RagClientServiceImpl` + DTOs `feature/rag/dto/*` (contract camelCase JSON sang rag-service), `config/SecurityConfig`, `JwtConfig`, `GlobalExceptionHandler`, `ApiResponse`.

---

## 5. Thay đổi rag-service (Python)

Tái dùng gần như toàn bộ pipeline (extract/chunk/embed/retrieve/cite/Qdrant). Cần sửa:

### 5.1. Đổi domain (bắt buộc — đang hardcode "lịch sử VN")

- `app/prompts/system_prompt.txt` → persona "trợ lý học tập / tài liệu giáo dục".
- `app/api/chat_routes.py` `_NO_DATA_MSG` (hardcode tiếng Việt) → message phù hợp.
- `app/services/prompt_service.py:38` câu hướng dẫn user-message.
- Collection name `history_chunks` → `edu_chunks` (env `QDRANT_COLLECTION`).
- Cosmetic: `main.py` title, `/rag/health` service string.

### 5.2. Scope theo Folder (bắt buộc — để "Ask AI theo folder")

Hiện chỉ filter theo `sourceIds`/`tagIds`. Thêm `folderId` (và `ownerId`) theo đúng pattern có sẵn:

1. `IngestMetadata` (`app/schemas/ingest.py`) + `_build_payload` (`ingest_service.py`) — thêm `folderId, ownerId`.
2. `_INDEXED_FIELDS` trong `app/vectorstore/qdrant_client.py` — index `folderId`.
3. `RagChatRequest`/`RagRetrieveRequest` — thêm `folderId`; thread qua `retrieval_service.retrieve` → `vector_repository.search` (filter `MatchValue`).

### 5.3. Citation thêm `snippet` (theo class diagram)

`chunkText` đã có trong Qdrant payload và đã trả ở `/retrieve`. Thêm field `snippet` vào `Citation` (`app/schemas/chat.py`) + populate trong `citation_service.to_citations`. (~vài dòng.)

### 5.4. ⚠️ Đọc file từ Cloud Storage (bắt buộc — rủi ro lớn nhất)

**Vấn đề đã xác minh:** `extract_service.extract()` chỉ parse PDF theo trang khi là **local `filePath`** (pypdf). Nhánh `sourceUrl` chỉ scrape **HTML** (BeautifulSoup) → **URL PDF của Cloudinary sẽ hỏng / mất số trang**.

**Giải pháp khuyến nghị:** nâng cấp `extract_service` để **tải binary file từ URL** rồi route theo content-type/đuôi file:

- Thêm hàm `_extract_remote_file(url)`: `httpx.get` → lưu temp → nếu PDF gọi `_extract_pdf` (giữ page number), DOCX/TXT tương tự; chỉ scrape HTML khi content-type là `text/html`.
- BE ingest sẽ truyền `sourceUrl = <Cloudinary URL>` (giữ luồng upload Cloudinary hiện có của FE).

(Phương án thay thế: BE tải file rồi gửi multipart sang một endpoint `/ingest-file` mới — phức tạp hơn, không khuyến nghị.)

---

## 6. Thay đổi Frontend (`apps/web`)

> Tin tốt: FE đã có sẵn axios client unwrap `response.data.data` → tương thích với `ApiResponse.data` của Java. Auth đã hybrid bearer+cookie. Đa số màn hình đã build.

| Việc                       | Chi tiết                                                                                                                                                                                      | File chính                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Rewire API client**      | Đổi xử lý lỗi sang đọc `error/details/statusCode` của Java; kiểm tra lại flow refresh token.                                                                                                  | `src/lib/axios.ts`                                         |
| **Cập nhật endpoints**     | Đồng bộ `API_ENDPOINTS` với contract Java mới (folders, chat, admin/config…).                                                                                                                 | `src/shared/constants.ts`, `src/apis/*`                    |
| **Auth store**             | JWT claims Java: `sub=email, userId, roles=[ROLE_USER\|ROLE_ADMIN]`. Map `ROLE_USER`→Student.                                                                                                 | `src/stores/auth/store.ts`                                 |
| **Folders UI** (MỚI)       | CRUD folder; my-documents chuyển sang cây Folder → Documents. Thay/bổ sung cho `subjects` cũ.                                                                                                 | `src/app/(main)/(user)/my-documents`, module mới `folders` |
| **Ask-AI / Chat UI** (MỚI) | Chọn folder → nhập câu hỏi → hiển thị `answerText` + danh sách Citation (số trang + snippet, click mở preview đúng trang). Cân nhắc dùng `POST /chat/stream` (SSE) cho trải nghiệm streaming. | route mới `src/app/(main)/(user)/ask` + module `chat`      |
| **Status badge** (MỚI)     | Badge `UPLOADING/INDEXING/READY/FAILED` trên document card; poll/refresh sau upload.                                                                                                          | `src/modules/documents/*`                                  |
| **Admin Settings thật**    | Thay stub bằng form Config (`allowedType`, `maxSizeMB`) nối `GET/PUT /admin/config`.                                                                                                          | `src/app/(main)/admin/settings/page.tsx`                   |
| **Upload validate**        | Validate size/type theo Config trước khi upload Cloudinary; BE re-validate metadata.                                                                                                          | module `uploads`                                           |

---

## 7. Hai luồng chính (cần vẽ Sequence Diagram)

### 7.1. Upload + Index (khớp Activity Diagram 1 + State Diagram)

```
Student → FE: chọn/tạo Folder, chọn file
FE → Cloudinary: upload (unsigned) → trả fileUrl, publicId
FE → BE  POST /documents {folderId, title, fileUrl, size, format}
BE: validate theo Config (maxSizeMB, allowedType)
BE → DB: tạo Document (status=UPLOADING → INDEXING)
BE → rag-service POST /ingest {sourceId=docId, folderId, sourceUrl=fileUrl, ...}  [async]
rag-service: download file → extract(per-page) → chunk → embed → Qdrant upsert
rag-service → BE: {status, chunks[]}
BE → DB: lưu Chunk metadata; Document.status = READY (hoặc FAILED)
FE: poll/refresh → badge READY
```

> Chạy **bất đồng bộ** (`@Async` hoặc message queue) để Uploading→Indexing→Ready đúng state machine và không block request upload.

### 7.2. Ask AI + Citation (khớp Activity Diagram 2)

```
Student → FE: chọn Folder, nhập câu hỏi
FE → BE  POST /chat {folderId, question, topK}
BE → rag-service POST /chat {question, folderId, topK}
rag-service: embed question → Qdrant search (filter folderId) → build prompt → Gemini
rag-service → BE: {answer, citations:[{documentId, pageNumber, snippet, score}]}
BE → FE: AnswerWithCitation
FE: hiển thị answer + citations (click → mở document đúng trang)
```

---

## 8. Lộ trình theo giai đoạn (Roadmap)

| Phase                        | Nội dung                                                                                                                                                        | Output kiểm chứng                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **0. Scaffold**              | Copy `backend/` + `rag-service/` vào RAG-edu (root). Viết `docker-compose` (mongo, qdrant, backend, rag-service, web). Archive `apps/api`.                      | `docker-compose up` lên đủ service; `/actuator/health` + `/rag/health` OK.            |
| **1. Backend core**          | Đổi persistence JPA→Mongo (§3.1). Gộp user 1 collection + auth. Document `@Document` Folder/Document/Chunk/Citation/Config + enum DocumentStatus + seed Config. | Register/login chạy; CRUD Mongo OK.                                                   |
| **2. rag-service domain**    | Đổi prompt/collection (§5.1), thêm folderId scope (§5.2), snippet (§5.3), download remote file (§5.4).                                                          | `pytest` pass; ingest 1 PDF Cloudinary giữ đúng page number; chat filter đúng folder. |
| **3. Wire BE ↔ rag-service** | Endpoint upload→ingest (async state machine), chat proxy (folderId), reindex, delete.                                                                           | Upload 1 doc → status chạy UPLOADING→READY; ask AI trả citation.                      |
| **4. Admin & stats**         | Config CRUD + RBAC; stats documents/users.                                                                                                                      | Admin đổi maxSize/allowedType; dashboard ra số thật.                                  |
| **5. FE rewire**             | API client, auth store, endpoints, folders UI, status badge.                                                                                                    | Đăng nhập + duyệt folder/doc với backend mới.                                         |
| **6. FE tính năng mới**      | Ask-AI chat UI (+citation, cân nhắc SSE), Admin Settings thật, upload validate.                                                                                 | Hỏi AI trong 1 folder, click citation mở đúng trang.                                  |
| **7. Diagrams & test**       | **(làm cuối, vẽ TỪ code thật sau khi đã ưng)** — cho AI sinh **Class Diagram** + **Sequence Diagram** từ entity/controller/luồng thực tế. E2E test toàn luồng.  | Bộ diagram khớp code + checklist E2E pass.                                            |

---

## 9. Rủi ro & điểm cần lưu ý

- **🔴 rag-service đọc file PDF từ Cloudinary (§5.4)** — phải nâng cấp `extract_service`, nếu không sẽ mất số trang/hỏng citation. Đây là rủi ro kỹ thuật lớn nhất.
- **🟠 Viết lại persistence JPA → MongoDB (§3.1)** — phần tốn công nhất khi giữ backend Java mà dùng Mongo. Auth/security/proxy vẫn tái dùng, chỉ entity + repository phải đổi.
- **Dung lượng**: MongoDB rất nhẹ (chỉ metadata; file ở Cloudinary, vector ở Qdrant). Không phải lo "tốn nhiều MB". Có thể bỏ luôn `content` chunk khỏi Mongo.
- **Đổi contract auth**: token/claims Java khác NestJS → phải test kỹ luồng refresh ở FE.
- **Embedding dim phải khớp Qdrant collection** (768). Đổi model embedding ⇒ phải tạo lại collection.
- **Gemini free-tier rate limit** khi ingest hàng loạt (script `scripts/load_dataset.py` của RAG-history có xử lý quota — tham khảo).
- **Java 25 + Spring Boot 4** khá mới — đảm bảo toolchain (JDK 25) có sẵn trên máy/CI.
- **Diagram vẽ sau cùng từ code** (Phase 7) theo đúng workflow của bạn — §3 (entity) và §7 (luồng) là bản nháp định hướng, bản chính thức sinh từ code thật khi đã ưng.

---

## 10. Kiểm chứng (Verification)

1. `docker-compose up` — mọi service healthy (`/actuator/health`, `/rag/health`).
2. **Auth**: register → login → `GET /auth/me` trả đúng role.
3. **Upload+Index**: tạo folder → upload PDF nhiều trang → document chuyển `UPLOADING→INDEXING→READY`; kiểm tra Qdrant có points với payload `folderId`, `pageNumber`.
4. **Ask AI**: hỏi trong folder → answer + citations có `pageNumber` + `snippet`; câu hỏi ngoài tài liệu → fallback "không đủ dữ liệu".
5. **Scope**: hỏi ở folder A không được trả nội dung folder B.
6. **Admin**: đổi `maxSizeMB`/`allowedType` → upload vi phạm bị chặn; dashboard ra số thật.
7. **FE E2E**: đăng nhập → duyệt/preview → hỏi AI → click citation mở đúng trang.
8. `pytest` (rag-service) + test backend pass.
