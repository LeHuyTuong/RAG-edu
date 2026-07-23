# Flow của 5 feature chính trong Frontend

Frontend hiện tại tổ chức nghiệp vụ theo 5 vertical slice:

    src/features/
    ├─ auth       # đăng nhập, session, phân quyền
    ├─ documents  # thư viện, tài liệu của tôi, detail, document mutations
    ├─ upload     # upload file và tạo document
    ├─ rag        # chọn nguồn và chat với RAG
    └─ admin      # dashboard và các thao tác quản trị

Quy tắc đọc chung của một feature:

    src/app route
      -> feature page
          -> feature hook
              -> feature api
                  -> shared/api/api-client
                      -> backend
          -> feature components

Các page trong src/app chủ yếu là route adapter. Chúng trỏ tới page thật trong
src/features. Page coordinator điều phối hook; hook gọi API hoặc quản lý client
state; component chủ yếu nhận props và hiển thị.

---

<a id="flow-auth"></a>

## 1. Feature auth

### 1.1. Cấu trúc thư mục

    features/auth/
    ├─ api/
    │  └─ auth.api.ts                 # signIn, signUp, /auth/me, signOut
    ├─ components/
    │  ├─ LoginView.tsx               # form đăng nhập
    │  └─ RegisterView.tsx            # form đăng ký
    ├─ guards/
    │  ├─ ProtectedRoute.tsx           # chặn route chưa đăng nhập
    │  └─ role.guard.ts               # kiểm tra role và redirect
    ├─ hooks/
    │  ├─ use-auth.ts                 # facade auth
    │  ├─ use-auth-mutations.ts       # login, register, logout
    │  ├─ use-current-user.ts         # query /auth/me
    │  └─ use-current-user-cache.ts   # cập nhật cache current user
    ├─ lib/
    │  ├─ auth.mapper.ts              # map account backend -> User frontend
    │  └─ auth.redirect.ts            # redirect an toàn
    ├─ store/
    │  └─ auth.store.ts               # Zustand: accessToken/session
    ├─ auth.keys.ts                   # React Query key
    ├─ types.ts                       # type auth
    └─ index.ts                       # public API của feature

index.ts là public entry point. Code bên ngoài feature dùng các hook/guard từ
features/auth thay vì import sâu vào file nội bộ.

### 1.2. Flow login

    src/app/(auth)/login/page.tsx
      -> features/auth/components/LoginView.tsx
          -> useLogin() trong hooks/use-auth-mutations.ts
              -> signIn() trong api/auth.api.ts
                  -> apiClient.post(API_ENDPOINTS.AUTH.LOGIN)
                      -> POST /api/v1/auth/signin
              -> useAuthStore.setAccessToken(token)
              -> fetchCurrentUser()
                  -> apiClient.get(API_ENDPOINTS.AUTH.ME)
                      -> GET /api/v1/auth/me
                  -> auth.mapper.mapCurrentAccount()
              -> queryClient.setQueryData(authKeys.me(), user)
          -> router.replace(redirect theo role)

State được chia như sau:

- auth.store.ts dùng Zustand để persist accessToken.
- use-current-user.ts dùng React Query để lấy/cache user.
- LoginView.tsx chỉ giữ input và hiển thị lỗi form.

### 1.3. Flow bảo vệ route

    src/app/(main)/(user)/layout.tsx
      -> routes/ProtectedRoute.tsx
          -> features/auth/guards/ProtectedRoute.tsx
              -> useAuth()
                  -> token từ auth.store
                  -> user từ useCurrentUser()
              -> chưa có user/token: redirect /login
              -> sai requiredRole: redirect về khu vực phù hợp
              -> hợp lệ: render UserShell và page

Admin dùng cùng guard nhưng truyền requiredRole="admin" trong
src/app/(main)/admin/layout.tsx.

### 1.4. File cần đọc

    LoginView
      -> use-auth-mutations
          -> auth.api
              -> auth.store + use-current-user
                  -> ProtectedRoute

---

<a id="flow-documents"></a>

## 2. Feature documents

### 2.1. Cấu trúc thư mục

    features/documents/
    ├─ api/
    │  └─ documents.api.ts             # document, subject, file, share endpoints
    ├─ pages/
    │  ├─ LibraryPage.tsx              # /library
    │  ├─ MyDocumentsPage.tsx          # /my-documents
    │  └─ DocumentDetailPage.tsx       # /documents/:id
    ├─ hooks/
    │  ├─ use-library-documents.ts     # danh sách thư viện
    │  ├─ use-my-documents.ts          # tài liệu của user
    │  ├─ use-document-detail.ts       # chi tiết theo id
    │  ├─ use-document-mutations.ts    # create/update/delete/approve/reject
    │  ├─ use-document-preview.ts      # Blob và preview
    │  ├─ use-document-file-actions.ts # open/download
    │  ├─ use-subjects.ts              # query subject
    │  └─ use-folder-options.ts        # query folder
    ├─ components/
    │  ├─ library/                     # FilterToolbar, DocumentGrid, Card
    │  ├─ detail/                      # hero, preview, author, share, related
    │  ├─ my-documents/                # table, stats, modal
    │  └─ RejectDocumentModal.tsx
    ├─ lib/
    │  ├─ document-query.ts            # normalize query
    │  └─ detail/                      # preview/download helper
    ├─ store/
    │  └─ library-filters.store.ts     # Zustand filter Library
    ├─ documents.keys.ts               # React Query keys
    ├─ types.ts                       # type documents
    └─ index.ts                       # public API của feature

Đây là feature trung tâm. upload, rag và một phần admin tái sử dụng hook hoặc
mutation của documents thay vì tự gọi lại document endpoint.

### 2.2. Flow Library

    src/app/(main)/(user)/library/page.tsx
      -> features/documents/pages/LibraryPage.tsx
          -> useLibraryFiltersStore()
              -> search, subjectId, format, sortBy, page
          -> useLibraryDocuments(query)
              -> normalizeDocumentListQuery(query)
              -> documentKeys.list(normalizedQuery)
              -> fetchDocuments(query) trong api/documents.api.ts
                  -> apiClient.get(API_ENDPOINTS.DOCUMENTS.BASE, { params })
                      -> GET /api/v1/documents
          -> useSubjects()
              -> fetchSubjects()
                  -> GET /api/v1/subjects
          -> FilterToolbar + DocumentGrid + Pagination

LibraryPage không tự quản lý cache/loading. React Query trả các trạng thái đó từ
useLibraryDocuments và useSubjects. Filter dùng Zustand vì toolbar và page cùng
đọc/thay đổi một bộ filter.

### 2.3. Flow document detail

    src/app/(main)/(user)/documents/[id]/page.tsx
      -> DocumentDetailPage.tsx
          -> useParams().id
          -> useDocumentDetail(id)
              -> documentKeys.detail(id)
              -> fetchDocumentDetail(id)
                  -> GET /api/v1/documents/:id
          -> useDocumentPreview(document, accessToken)
              -> fetchDocumentFile(id, token, "inline")
              -> loadDocumentPreview(document, blob)
          -> useLibraryDocuments({ subjectId, limit: 4 })
              -> tài liệu liên quan
          -> DocumentHero / DocumentPreview / FileInfoCard /
             ShareCard / AuthorCard

Preview/download dùng Blob và object URL ở local state, không đưa Blob vào
React Query cache.

### 2.4. Flow mutation và cache

    Page hoặc component
      -> useCreateDocument/useUpdateDocument/useDeleteDocument/...
          -> api/documents.api.ts
              -> apiClient.post/patch/delete(...)
                  -> backend
          -> invalidateDocumentViews()
              -> invalidate document lists
              -> invalidate my documents
              -> invalidate document detail
          -> React Query refetch
          -> UI hiển thị dữ liệu mới

Các mutation được admin dùng để duyệt/từ chối:

    useApproveDocument()
      -> approveDocument(id)
          -> POST /api/v1/documents/:id/approve

    useRejectDocument()
      -> rejectDocument(id, { rejectionReason })
          -> POST /api/v1/documents/:id/reject

Cả hai đều invalidate các query document sau khi thành công.

### 2.5. File cần đọc

    LibraryPage/MyDocumentsPage/DocumentDetailPage
      -> hook tương ứng
          -> documents.api.ts
              -> documents.keys.ts
              -> use-document-mutations.ts

---

<a id="flow-upload"></a>

## 3. Feature upload

### 3.1. Cấu trúc thư mục

    features/upload/
    ├─ api/
    │  └─ upload.api.ts                # config và upload multipart
    ├─ components/
    │  ├─ FileUploadBox.tsx            # chọn/kéo thả/validate file
    │  └─ DocumentUploadForm.tsx       # nhập metadata
    ├─ hooks/
    │  ├─ use-upload-config.ts         # query config upload
    │  ├─ use-upload-form.ts           # form state + validate submit
    │  └─ use-create-uploaded-document.ts
    │                                  # upload file rồi tạo document
    ├─ pages/
    │  └─ UploadPage.tsx               # coordinator màn upload
    └─ index.ts                        # public API của feature

### 3.2. File gọi nhau như thế nào?

    src/app/(main)/(user)/uploads/page.tsx
      -> features/upload/pages/UploadPage.tsx
          -> useUploadConfig()
              -> upload.api.fetchUploadConfig()
                  -> GET /api/v1/upload/config
          -> useSubjects()             [features/documents]
          -> useFolderOptions()        [features/documents]
          -> useUploadForm({ selectedFile, onSuccess })
              -> useCreateUploadedDocument()
          -> FileUploadBox
              -> validateFile(file, config)
              -> onFileChange(file)
          -> DocumentUploadForm
              -> setField(field, value)
              -> submit()

### 3.3. Flow submit upload

    useUploadForm.submit()
      -> kiểm tra selectedFile và title
      -> useCreateUploadedDocument.mutateAsync()
          -> upload.api.uploadFile(file)
              -> tạo FormData
              -> POST /api/v1/upload
              -> nhận fileUrl, publicId, size, format, resourceType
          -> documents.useCreateDocument(metadata + uploadedFile)
              -> documents.api.createDocument()
                  -> POST /api/v1/documents
          -> invalidate document list/mine queries
      -> reset form
      -> UploadPage hiển thị success state

Upload không tự tạo document API riêng. Nó upload file trước rồi tái sử dụng
useCreateDocument của documents để tạo bản ghi. Nhờ vậy cache document được
quản lý thống nhất.

---

<a id="flow-rag"></a>

## 4. Feature rag

### 4.1. Cấu trúc thư mục

    features/rag/
    ├─ api/
    │  └─ rag.api.ts                   # chat, stream, retrieve, ingest, source
    ├─ components/
    │  └─ ChatBubble.tsx               # message và citations
    ├─ hooks/
    │  ├─ use-folder-chat-sources.ts   # documents + source selection
    │  ├─ use-rag-chat-stream.ts       # messages + SSE state
    │  └─ use-rag-chat.ts              # non-stream chat
    ├─ lib/
    │  ├─ rag-sources.ts               # rule document READY/chunk
    │  └─ normalize-agent-response.ts  # làm sạch text Agent
    ├─ pages/
    │  └─ FolderChatPage.tsx           # workspace /folders/:id
    └─ index.ts                        # public API của feature

### 4.2. Chuẩn bị nguồn chat

    src/app/(main)/(user)/folders/[id]/page.tsx
      -> features/rag/pages/FolderChatPage.tsx
          -> useParams().id
          -> useFolderChatSources(folderId)
              -> useLibraryDocuments({
                   folderId, onlyMine: true, limit: 50
                 })                   [features/documents]
                  -> GET /api/v1/documents
              -> useFolderOptions()    [features/documents]
              -> isDocumentReadyForAi(document)
                  -> ragStatus === "READY"
                  -> chunkCount > 0
              -> selectedDocumentIds
              -> readySourceIds

FolderChatPage quản lý checkbox/chọn tài liệu bằng client state. Chỉ
readySourceIds mới được gửi lên backend RAG.

### 4.3. Flow gửi câu hỏi streaming

    FolderChatPage.handleSend()
      -> useRagChatStream.send({ folderId, sourceIds })
          -> thêm user message
          -> thêm assistant placeholder
          -> rag.api.chatStream(payload, accessToken, callbacks)
              -> fetch(POST /api/v1/rag/chat/stream)
              -> đọc response.body.getReader()
              -> parse SSE
                  -> onChunk(token)
                  -> onCitations(citations)
                  -> onComplete(fullText)
          -> cập nhật messages bằng useState
          -> ChatBubble render message

chatStream dùng fetch gốc vì cần đọc SSE theo từng chunk. AbortController được
giữ trong hook để nút Dừng hủy stream.

### 4.4. Flow hiển thị response Agent

    Agent response
      -> RagChatMessage.content
      -> ChatBubble
          -> normalizeAgentResponse(content)
              -> bỏ sourceType/sourceId và marker kỹ thuật
          -> hiển thị plain text
          -> citations hiển thị riêng

File cần đọc theo thứ tự:

    FolderChatPage
      -> use-folder-chat-sources
          -> use-rag-chat-stream
              -> rag.api
                  -> ChatBubble
                      -> normalize-agent-response

---

<a id="flow-admin"></a>

## 5. Feature admin

### 5.1. Cấu trúc thư mục

    features/admin/
    ├─ api/
    │  └─ admin.api.ts                 # dashboard, account, subject, billing, config
    ├─ components/
    │  ├─ AdminShell.tsx               # layout/navigation admin
    │  └─ AdminPrimitives.tsx          # card/icon primitive
    ├─ hooks/
    │  ├─ use-admin-dashboard.ts
    │  ├─ use-admin-accounts.ts
    │  ├─ use-admin-subjects.ts
    │  ├─ use-admin-billing-plans.ts
    │  └─ use-admin-config.ts
    ├─ pages/
    │  ├─ AdminDashboardPage.tsx
    │  ├─ AdminDocumentManagementPage.tsx
    │  ├─ AdminDocumentDetailPage.tsx
    │  ├─ AdminUserManagementPage.tsx
    │  ├─ AdminSubjectManagementPage.tsx
    │  ├─ AdminBillingPlanManagementPage.tsx
    │  └─ AdminSystemSettingsPage.tsx
    ├─ admin.keys.ts                   # React Query keys
    ├─ types.ts                        # type admin
    └─ index.ts                        # public API của feature

Admin có một điểm đặc biệt: nghiệp vụ duyệt/từ chối document tái sử dụng API
và mutation của features/documents, không khai báo lại trong admin.api.ts.

### 5.2. Admin dashboard

    src/app/(main)/admin/page.tsx
      -> features/admin/pages/AdminDashboardPage.tsx
          -> useAdminDashboard()
              -> adminQueryKeys.dashboard()
              -> adminApi.getDashboard()
                  -> GET /api/v1/admin/dashboard
          -> buildStats(response)
          -> render statistic cards và revenue chart

Page chỉ chuyển response thành view model. Request/cache nằm ở
use-admin-dashboard.ts và admin.api.ts.

### 5.3. Admin document: list -> detail -> approve/reject

Bước 1, danh sách:

    src/app/(main)/admin/documents/page.tsx
      -> AdminDocumentManagementPage.tsx
          -> useLibraryDocuments({ status, page, limit })
              -> features/documents/api/documents.api.ts
                  -> GET /api/v1/documents
          -> hiển thị ragStatus
          -> click dòng
              -> /admin/documents/:id

Chỉ document có ragStatus === "PENDING_REVIEW" được xem là đang chờ admin
quyết định.

Bước 2, chi tiết:

    src/app/(main)/admin/documents/[id]/page.tsx
      -> AdminDocumentDetailPage.tsx
          -> useDocumentDetail(id)       [features/documents]
              -> GET /api/v1/documents/:id
          -> useDocumentPreview()        [features/documents]
              -> tải Blob để xem trước
          -> canReview = document.ragStatus === "PENDING_REVIEW"
          -> bật nút Duyệt/Từ chối

Bước 3, duyệt:

    AdminDocumentDetailPage
      -> useApproveDocument()            [features/documents]
          -> approveDocument(id)
              -> apiClient.post(API_ENDPOINTS.DOCUMENTS.APPROVE(id))
                  -> POST /api/v1/documents/:id/approve
          -> invalidateDocumentViews()
              -> invalidate list + mine + detail
          -> UI refetch và hiển thị status mới

Bước 4, từ chối:

    AdminDocumentDetailPage
      -> RejectDocumentModal
          -> admin nhập rejectionReason
      -> useRejectDocument()             [features/documents]
          -> rejectDocument(id, { rejectionReason })
              -> POST /api/v1/documents/:id/reject
          -> invalidateDocumentViews()
          -> document chuyển sang REJECTED

Sau khi duyệt, frontend không tự index hoặc tạo embedding. Backend tiếp tục xử
lý trạng thái RAG, ví dụ INDEXING rồi READY hoặc FAILED. Frontend refetch và
hiển thị ragStatus.

### 5.4. Các màn admin khác

Các màn accounts, subjects, billing và config dùng mẫu:

    Admin page
      -> useAdmin... hook
          -> adminQueryKeys
          -> adminApi.method()
              -> API_ENDPOINTS
              -> apiClient
                  -> backend
          -> mutation success
              -> invalidate admin query

Ví dụ subjects:

    AdminSubjectManagementPage
      -> useAdminSubjects()
      -> useCreateAdminSubject/useUpdateAdminSubject/useDeleteAdminSubject()
          -> adminApi.getSubjects/createSubject/updateSubject/deleteSubject()
              -> /api/v1/subjects
          -> invalidate adminQueryKeys.subjects()

---

## 6. Quan hệ giữa 5 feature

    auth      -> documents
    documents -> upload
    auth      -> rag
    documents -> rag
    auth      -> admin
    documents -> admin

- auth là nền tảng: các flow cần token/user dùng useAuth hoặc ProtectedRoute.
- documents là domain dữ liệu trung tâm.
- upload phụ thuộc documents để tạo document sau khi upload file.
- rag phụ thuộc auth để lấy token và documents để lấy source trong folder.
- admin phụ thuộc auth để giới hạn role và documents để preview/duyệt/từ chối.

Khi cần sửa nghiệp vụ, bắt đầu tại page của feature rồi đọc:

    page -> hook -> api -> API_ENDPOINTS -> apiClient

Không nên bắt đầu từ component UI vì component thường chỉ nhận props và render;
business flow nằm ở page coordinator, custom hook và API layer.
