# Class Diagram — RAG-edu Architecture

```mermaid
classDiagram
    %% ==================== BACKEND (Spring Boot - Java) ====================

    class DocumentController {
        +POST /api/v1/documents
        +POST /{id}/approve
        +POST /{id}/reject
        +GET /pending
    }

    class DocumentService {
        <<interface>>
        +create() DocumentResponse
        +approve(id, userId)
        +triggerIngest(id, userId)
        +reject(id, reason, userId)
        +getPendingReviews() List~DocumentResponse~
    }

    class DocumentServiceImpl {
        -DocumentRepository documentRepository
        -RagClientService ragClientService
        -ApplicationEventPublisher eventPublisher
        +create()
        +approve()  // nếu PENDING_REVIEW → triggerIngest
        +triggerIngest()  // gọi ragClientService.ingest()
        +reject()
    }

    class DocumentIngestListener {
        -DocumentRepository documentRepository
        -RagClientService ragClientService
        +handleDocumentIngest(event)
        // Flow: REVIEWING → classify
        //   confidence >= 0.9 → auto index → READY
        //   confidence < 0.9 → PENDING_REVIEW (chờ admin)
        //   isHistory=false → PENDING_REVIEW + DANGER
    }

    class Document {
        -Long id
        -String title
        -String fileUrl
        -DocumentStatus status
        -Double aiConfidence
        -String aiWarningLevel  // NONE | WARNING | DANGER
        -String aiReviewStatus  // AUTO_APPROVED | PENDING_ADMIN | REJECTED_BY_AI
        -Long folderId
        -Long ownerId
    }

    class DocumentStatus {
        <<enum>>
        UPLOADING
        REVIEWING
        PENDING_REVIEW
        INDEXING
        REINDEXING
        READY
        FAILED
        REJECTED
        SOFT_DELETED
    }

    class FolderController {
        +POST /api/v1/folders
        +POST /{id}/chat
        +POST /{id}/share
        +DELETE /{id}/share
        +GET /shared/{token}  // public, no JWT
        +POST /shared/{token}/chat  // public, no JWT
    }

    class Folder {
        -Long id
        -String folderName
        -Long ownerId
        -String shareToken
        -Boolean shareEnabled
    }

    class RagController {
        +POST /api/v1/rag/chat
        +POST /api/v1/rag/chat/stream
        +POST /api/v1/rag/retrieve
    }

    class RagClientService {
        <<interface>>
        +chat(request, traceparent) RagChatResponse
        +classify(request, traceparent) RagClassifyResponse
        +ingest(request, traceparent) RagIngestResponse
        +deleteSource(sourceId, traceparent)
    }

    class RagClientServiceImpl {
        -WebClient webClient
        +post(path, request, traceparent, responseType)
    }

    AdminDashboardServiceImpl --> DocumentService
    AdminDashboardServiceImpl --> UserService

    %% ==================== RAG SERVICE (FastAPI - Python) ====================

    class ChatRoutes {
        +POST /rag/chat
        +POST /rag/chat/stream
        +GET /rag/health
        // Flow: route() → retrieve() → build_user_message() → generate() → to_citations()
    }

    class ClassifyRoutes {
        +POST /rag/classify
    }

    class IngestRoutes {
        +POST /rag/ingest
        +DELETE /rag/delete
    }

    class QuestionRouterService {
        +route(question, useGraph) dict
        // MVP: luôn trả {use_vector: True, use_graph: False}
    }

    class RetrievalService {
        +retrieve(question, topK, filters) List~ScoredPoint~
        // 1. embed_query(question) → vector[768]
        // 2. vector_repository.search() → cosine search Qdrant
    }

    class EmbeddingService {
        +embed_query(text) List~float~  // vector 768 chiều
        +embed_documents(texts) List~List~float~~
        -embed_gemini(texts, taskType)
        -embed_local(texts)  // fallback: keepitreal/vietnamese-sbert
    }

    class LLMService {
        +generate(systemPrompt, userMessage, temperature) str
        +generate_stream(systemPrompt, userMessage, temperature) Generator
        -generate_cerebras()
        -generate_google()
    }

    class PromptService {
        +load_system_prompt() str
        +build_user_message(question, hits) str
        // Format hits thành [C1] title (trang X) \n chunkText...
    }

    class CitationService {
        +to_citations(hits) List~Citation~
        // Dedup + truncate chunkText → snippet 300 ký tự
    }

    class ClassifyService {
        +classify(request) RagClassifyResponse
        // extract sample text → LLM classify → parse JSON
    }

    class IngestService {
        +ingest(request) RagIngestResponse
        // extract → chunk → embed → upsert Qdrant
    }

    class ExtractService {
        +extract(rawContent, filePath, sourceUrl) List~PageText~
        // Hỗ trợ PDF, DOCX, TXT, MD, HTML
    }

    class ChunkService {
        +chunk(pages, chunkSize, chunkOverlap) List~ChunkData~
        // Sliding window: chunk_size=800, overlap=120
    }

    class VectorRepository {
        +search(collection, queryVector, topK, filters) List~ScoredPoint~
        +upsert(collection, ids, vectors, payloads)
        +delete_by_source_id(collection, sourceId)
    }

    class QdrantClient {
        +get_client() QdrantClient
        +ensure_collection(collection, size)
    }

    class RagChatRequest {
        +str question
        +int topK
        +int folderId
        +int userId  // null với public shared chat
    }

    class RagChatResponse {
        +str answer
        +List~Citation~ citations
        +bool usedVector
        +bool usedGraph
    }

    class RagClassifyRequest {
        +int sourceId
        +str title
        +str filePath
        +str sourceUrl
        +str rawContent
    }

    class RagClassifyResponse {
        +int sourceId
        +bool isHistory
        +float confidence
        +str label  // HISTORY | NOT_HISTORY | UNKNOWN
        +str reason
    }

    class ScoredPoint {
        +str id
        +float score  // cosine similarity
        +dict payload  // chunkText, title, sourceId, pageNumber...
    }

    %% ==================== RELATIONS ====================

    %% Backend relations
    DocumentController --> DocumentService
    DocumentController --> RagClientService
    DocumentServiceImpl ..|> DocumentService
    DocumentServiceImpl --> DocumentRepository
    DocumentServiceImpl --> RagClientService
    DocumentServiceImpl --> FolderService
    DocumentServiceImpl --> UserService
    DocumentServiceImpl --> FileStorageService
    DocumentServiceImpl --> ApplicationEventPublisher
    DocumentIngestListener --> DocumentRepository
    DocumentIngestListener --> RagClientService
    DocumentIngestListener ..> Document : updates status

    FolderController --> FolderService
    FolderController --> RagService
    FolderServiceImpl ..|> FolderService
    FolderServiceImpl --> FolderRepository

    RagController --> RagService
    RagController --> DocumentService
    RagController --> FolderService
    RagServiceImpl ..|> RagService
    RagServiceImpl --> RagClientService
    RagClientServiceImpl ..|> RagClientService
    RagClientServiceImpl --> WebClient

    %% RAG Service relations
    ChatRoutes --> QuestionRouterService : route()
    ChatRoutes --> RetrievalService : retrieve()
    ChatRoutes --> PromptService : build_user_message()
    ChatRoutes --> LLMService : generate()
    ChatRoutes --> CitationService : to_citations()

    ClassifyRoutes --> ClassifyService
    ClassifyService --> ExtractService : lấy text mẫu
    ClassifyService --> LLMService : gọi LLM classify

    IngestRoutes --> IngestService
    IngestService --> ExtractService : bước 1
    IngestService --> ChunkService : bước 2
    IngestService --> EmbeddingService : bước 3
    IngestService --> VectorRepository : bước 4 upsert

    RetrievalService --> EmbeddingService : embed_query()
    RetrievalService --> VectorRepository : search()

    VectorRepository --> QdrantClient : get_client()

    %% Cross-boundary (HTTP)
    RagClientServiceImpl ..> ChatRoutes : HTTP POST /rag/chat
    RagClientServiceImpl ..> ClassifyRoutes : HTTP POST /rag/classify
    RagClientServiceImpl ..> IngestRoutes : HTTP POST /rag/ingest
```
