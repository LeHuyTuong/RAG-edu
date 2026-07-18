"""Pydantic schemas cho classify flow: request từ Spring Boot và response trả về."""
from pydantic import BaseModel
from typing import Optional


class RagClassifyRequest(BaseModel):
    sourceId: int
    title: Optional[str] = None
    filePath: Optional[str] = None
    sourceUrl: Optional[str] = None
    rawContent: Optional[str] = None


class RagClassifyResponse(BaseModel):
    sourceId: int
    isHistory: bool
    confidence: float
    label: str  # "HISTORY" | "NOT_HISTORY" | "UNKNOWN"
    reason: str
