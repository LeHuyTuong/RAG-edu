"""Pydantic schemas cho classify flow: request từ Spring Boot và response trả về."""
from pydantic import BaseModel


class RagClassifyRequest(BaseModel):
    sourceId: int
    title: str | None = None
    filePath: str | None = None
    sourceUrl: str | None = None
    rawContent: str | None = None


class RagClassifyResponse(BaseModel):
    sourceId: int
    isHistory: bool
    confidence: float
    label: str  # "HISTORY" | "NOT_HISTORY" | "UNKNOWN"
    reason: str
