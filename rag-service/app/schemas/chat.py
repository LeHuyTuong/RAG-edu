"""
Pydantic schemas cho chat flow: request từ Spring Boot và response trả về.

Vai trò: định nghĩa "hợp đồng" API giữa Spring Boot và RAG service cho /rag/chat.
Spring Boot serialize Java object → JSON → RAG service deserialize vào đây.

3 model:
  RagChatRequest  — câu hỏi + tham số tuning (topK, filter, temperature)
  RagChatResponse — answer text + danh sách citations + flags (usedVector/Graph)
  Citation        — 1 nguồn được dùng để trả lời: sourceType, title, score...

Response kèm citations khi answer thật sự dựa trên context. Với fallback
"dữ liệu chưa đủ", citations phải rỗng để không gợi ý sai nguồn tham khảo.
"""
from pydantic import BaseModel
from typing import Optional


class Citation(BaseModel):
    sourceType: str  # "DOCUMENT" | "ARTICLE" | "URL" | "MANUAL_INPUT"
    sourceId: Optional[int] = None
    articleId: Optional[int] = None
    documentId: Optional[int] = None
    title: Optional[str] = None
    slug: Optional[str] = None
    pageNumber: Optional[int] = None
    chunkIndex: Optional[int] = None
    score: Optional[float] = None  # cosine similarity score từ Qdrant
    snippet: Optional[str] = None  # ~300 ký tự đầu chunkText


class RagChatRequest(BaseModel):
    question: str
    topK: Optional[int] = None  # None = dùng default_top_k từ config
    useGraph: bool = False    # luôn False trong MVP; chừa chỗ cho Neo4j sau
    sourceIds: list[int] = []  # filter: chỉ search trong các source này
    tagIds: list[int] = []     # filter: chỉ search chunk có gắn tag này
    temperature: float = 0.2
    folderId: Optional[int] = None
    userId: Optional[int] = None


class RagChatResponse(BaseModel):
    answer: str
    citations: list[Citation]
    usedVector: bool
    usedGraph: bool
