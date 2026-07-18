# Chat Flow — Bước 2 đến 4 (sau khi có hits)

```
                              ┌──────────────┐
                              │    có hits    │
                              │ list[ScoredPoint] │
                              └──────┬───────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
    ┌─────────────────┐   ┌──────────────────┐   ┌───────────────────┐
    │  PromptService   │   │   LLMService     │   │ CitationService    │
    │                  │   │                  │   │                    │
    │ load_system_prompt│   │  generate(sys,   │   │ to_citations(hits) │
    │ build_user_msg() │   │   user, temp)    │   │ → list[Citation]   │
    │                  │   │                  │   │                    │
    │ → system_prompt  │   │ → answer string  │   │ → dedup theo       │
    │ → [C1]...[Cn]   │   │                  │   │   (sourceId, chunk) │
    │   context        │   │   Cerebras API   │   │ → truncate 300 ký tự│
    └────────┬─────────┘   │   hoặc Google    │   └─────────┬──────────┘
             │             └────────┬─────────┘             │
             │                      │                       │
             └──────────────────────┼───────────────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────┐
                     │   RagChatResponse        │
                     │   - answer (từ LLM)      │
                     │   - citations (từ Cit.)  │
                     │   - usedVector: true     │
                     │   - usedGraph: false     │
                     └─────────────────────────┘
```

## Chi tiết từng bước

### Bước 2 — PromptService: build context từ hits

File: `rag-service/app/services/prompt_service.py`

```
load_system_prompt()
  → đọc file rag-service/app/prompts/system_prompt.txt
  → trả về system_prompt string

build_user_message(question, hits)
  → với mỗi hit trong hits (tối đa 5):
      lấy payload: title, sourceId, pageNumber, chunkText, score
      format: [C1] sourceType=DOCUMENT; sourceId=5; title="Lịch sử VN"; pageNumber=12; score=0.87
              Nội dung chunk...
  → trả về:
      CONTEXT:
      [C1] ...
      [C2] ...

      QUESTION:
      Nhà Trần thành lập năm nào?

      Yêu cầu: Trả lời dựa trên CONTEXT...
```

### Bước 3 — LLMService: generate answer

File: `rag-service/app/services/llm_service.py`

```
generate(system_prompt, user_message, temperature=0.2)
  |
  ├── LLM_PROVIDER == "cerebras"
  │     → _generate_cerebras(sys, user, temp)
  │       POST https://api.cerebras.ai/v1/chat/completions
  │       model: gpt-oss-120b
  │       → _clean_text() → answer string
  |
  └── LLM_PROVIDER == "google"
        → _generate_google(sys, user, temp)
          model: gemma-4-31b-it
          → _clean_text() → answer string
```

### Bước 4 — CitationService: map hits → citations

File: `rag-service/app/services/citation_service.py`

```
to_citations(hits)
  → với mỗi hit:
      snippet = chunkText[:300]  # lấy 300 ký tự đầu
      Citation {
        sourceType: "DOCUMENT",
        sourceId: 5,
        title: "Lịch sử Việt Nam",
        pageNumber: 12,
        chunkIndex: 3,
        score: 0.87,
        snippet: "Nhà Trần được thành lập năm 1226..."
      }
  → dedup theo (sourceType, sourceId, chunkIndex)
  → trả list[Citation]
```

## Kết quả trả về

```json
{
  "answer": "Nhà Trần được thành lập năm 1226 dưới triều vua Trần Thái Tông...",
  "citations": [
    {
      "sourceType": "DOCUMENT",
      "sourceId": 5,
      "title": "Lịch sử Việt Nam thời Trần",
      "pageNumber": 12,
      "chunkIndex": 3,
      "score": 0.87,
      "snippet": "Nhà Trần được thành lập năm 1226..."
    }
  ],
  "usedVector": true,
  "usedGraph": false
}
```
