# Retrieval Flow — File-to-File Sequence

```mermaid
sequenceDiagram
    participant chat_routes as chat_routes.py
    participant router as question_router_service.py
    participant retrieval as retrieval_service.py
    participant embed as embedding_service.py
    participant vrepo as vector_repository.py
    participant qdrant as Qdrant Cloud
    participant prompt as prompt_service.py
    participant llm as llm_service.py
    participant cite as citation_service.py

    Note over chat_routes,router: Bước 0: Routing
    chat_routes->>router: route(question, useGraph)
    router-->>chat_routes: {"use_vector": True, "use_graph": False}

    Note over chat_routes,retrieval: Bước 1: Retrieve
    chat_routes->>retrieval: retrieve(question, topK=5, folderId, userId...)

    Note over retrieval,embed: Bước 1a: Embed câu hỏi
    retrieval->>embed: embed_query("Nhà Trần thành lập năm nào?")
    embed->>embed: _embed([text], "RETRIEVAL_QUERY")
    Note over embed: Gọi Gemini API / local model
    embed-->>retrieval: vector[768] ← [0.125, -0.034, 0.567...]

    Note over retrieval,vdrepo: Bước 1b: Search Qdrant
    retrieval->>vdrepo: search(collection, vector, topK=5, score_threshold=0.5, filters...)

    Note over vdrepo,qdrant: Build filter + query Qdrant
    vrepo->>vdrepo: Build Filter: field folderId=? userId=?
    vrepo->>qdrant: query_points(collection, query, limit=5, filter, score_threshold=0.5)
    qdrant->>qdrant: Cosine similarity giữa vector hỏi vs toàn bộ vectors
    qdrant-->>vdrepo: result.points → list[ScoredPoint]

    Note over vdrepo: Mỗi ScoredPoint = {id, score, payload: {chunkText, title, sourceId...}}
    vrepo-->>retrieval: list[ScoredPoint]
    retrieval-->>chat_routes: list[ScoredPoint]

    Note over chat_routes: if not hits → trả _NO_DATA_MSG

    Note over chat_routes,prompt: Bước 2: Build prompt
    chat_routes->>prompt: load_system_prompt()
    prompt-->>chat_routes: system_prompt string
    chat_routes->>prompt: build_user_message(question, hits)
    Note over prompt: Format hits → [C1] Nguồn:... \n Nội dung...
    prompt-->>chat_routes: user_message string

    Note over chat_routes,llm: Bước 3: LLM generate
    chat_routes->>llm: generate(system_prompt, user_message, temperature=0.2)
    Note over llm: Cerebras API / Google GenAI
    llm-->>chat_routes: answer string

    Note over chat_routes,cite: Bước 4: Citations
    chat_routes->>cite: to_citations(hits)
    Note over cite: Dedup, truncate 300 ký tự
    cite-->>chat_routes: list[Citation]

    Note over chat_routes: Trả RagChatResponse(answer, citations, usedVector=True)
```

## File Mapping

| Bước | File                                                  | Vai trò                                |
| ---- | ----------------------------------------------------- | -------------------------------------- |
| 0    | `rag-service/app/api/chat_routes.py`                  | Nhận request, điều phối pipeline       |
| 0    | `rag-service/app/services/question_router_service.py` | Quyết định dùng vector/graph           |
| 1    | `rag-service/app/services/retrieval_service.py`       | Embed + Search Qdrant                  |
| 1a   | `rag-service/app/services/embedding_service.py`       | Embed câu hỏi → vector 768             |
| 1b   | `rag-service/app/vectorstore/vector_repository.py`    | Build filter + query_points() → Qdrant |
| 2    | `rag-service/app/services/prompt_service.py`          | Format hits → [C1]...[Cn] context      |
| 3    | `rag-service/app/services/llm_service.py`             | Cerebras/Google generate answer        |
| 4    | `rag-service/app/services/citation_service.py`        | Map ScoredPoint → Citation             |
