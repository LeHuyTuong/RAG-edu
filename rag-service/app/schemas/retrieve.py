"""
Schemas cho retrieval debug flow.

Endpoint /rag/retrieve cho phép Spring Boot hoặc script benchmark kiểm tra
riêng bước embedding + Qdrant search mà không gọi LLM. Đây là công cụ kết nối
và debug ingestion: nếu retrieve chưa ra chunk đúng thì chat khó trả đúng.
"""
from pydantic import BaseModel
from typing import Optional


class RagRetrieveRequest(BaseModel):
    question: str
    topK: Optional[int] = None
    sourceIds: list[int] = []
    tagIds: list[int] = []
    folderId: Optional[int] = None
    userId: Optional[int] = None


class RetrievalHit(BaseModel):
    sourceType: str
    sourceId: Optional[int] = None
    articleId: Optional[int] = None
    documentId: Optional[int] = None
    title: Optional[str] = None
    slug: Optional[str] = None
    pageNumber: Optional[int] = None
    chunkIndex: Optional[int] = None
    score: Optional[float] = None
    chunkText: Optional[str] = None


class RagRetrieveResponse(BaseModel):
    question: str
    topK: int
    hits: list[RetrievalHit]
