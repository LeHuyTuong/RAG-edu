# Retrieval Class Diagram

```
                                        CHAT ROUTES
                              ┌──────────────────────────────────┐
                              │  +chat(req) RagChatResponse      │
                              │  +chat_stream(req) SSE           │
                              │  +health() dict                 │
                              │  -_chat(req)                    │
                              │  -_stream_chat_events(req)      │
                              │  -_answer_events(...)           │
                              │  -_sse(event, data)             │
                              │  -_chunk_text(text)             │
                              │  -_NO_DATA_MSG                  │
                              └──┬──────┬──────┬──────┬──────┬──┘
                                 │      │      │      │      │
              ┌──────────────────┘      │      │      │      └──────────────┐
              │          ┌──────────────┘      │      └──────────────┐      │
              ▼          ▼          ▼          ▼          ▼          ▼      │
┌─────────────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐    │
│ QuestionRouter  │ │Retrieve│ │  Prompt  │ │   LLM    │ │ Citation  │    │
│ Service         │ │ Service│ │ Service  │ │ Service  │ │ Service   │    │
├─────────────────┤ ├─────────┤ ├──────────┤ ├──────────┤ ├───────────┤    │
│ +route() → dict │ │+retrieve│ │+load_sys │ │+generate │ │+to_cit.  │    │
└─────────────────┘ │() → list│ │+build_   │ │+generate_│ │() → list  │    │
                    └────┬────┘ │user_msg  │ │stream    │ └───────────┘    │
                         │      └──────────┘ └──────────┘                  │
                         │                                                 │
              ┌──────────┴──────────┐                                       │
              ▼                     ▼                                       │
┌──────────────────────┐ ┌────────────────────┐                             │
│  Embedding Service   │ │ VectorRepository   │                             │
├──────────────────────┤ ├────────────────────┤                             │
│ +embed_query() → vec │ │ +point_id() → str  │                             │
│ +embed_documents()   │ │ +upsert() → None   │                             │
│ -_gemini_client      │ │ +search() → list   │                             │
│ -_local_model        │ │ +delete_by_source() │                             │
│ -_get_gemini_client()│ └─────────┬──────────┘                             │
│ -_get_local_model()  │           │                                        │
│ -_embed()            │           ▼                                        │
│ -_embed_gemini()     │ ┌────────────────────┐                             │
│ -_embed_local()      │ │   QdrantClient     │                             │
│ -_GEMINI_BATCH_SIZE  │ ├────────────────────┤                             │
└──────────────────────┘ │ +get_client() → Qd │                             │
                         │ +ensure_collection │                             │
                         │ -_client           │                             │
                         │ -_INDEXED_FIELDS   │                             │
                         └────────────────────┘                             │
                                                                            │
                                                                            │
                                              ┌─────────────────────────────┘
                                              ▼
                                    ┌──────────────────┐
                                    │  CitationService  │
                                    ├──────────────────┤
                                    │ +to_citations()→  │
                                    │   list[Citation]  │
                                    │ -_to_int()        │
                                    └──────────────────┘
```

## Quan hệ giữa các file

```
ChatRoutes         ──→ QuestionRouterService   : route()
ChatRoutes         ──→ RetrievalService        : retrieve()
ChatRoutes         ──→ PromptService           : build_user_message()
ChatRoutes         ──→ LLMService              : generate()
ChatRoutes         ──→ CitationService         : to_citations()
RetrievalService   ──→ EmbeddingService        : embed_query()
RetrievalService   ──→ VectorRepository        : search()
VectorRepository   ──→ QdrantClient            : get_client()
```

## Data Flow

```
request ──→ ChatRoutes
              │
              ├── route() ──→ {"use_vector": true}
              │
              ├── retrieve()
              │     ├── embed_query() ──→ vector[768]
              │     └── search() ──→ query_points() ──→ list[ScoredPoint]
              │
              ├── build_user_message(question, hits) ──→ "[C1]...[Cn]"
              │
              ├── generate(system_prompt, user_message) ──→ answer
              │
              └── to_citations(hits) ──→ list[Citation]
              │
              ▼
         RagChatResponse(answer, citations)
```
