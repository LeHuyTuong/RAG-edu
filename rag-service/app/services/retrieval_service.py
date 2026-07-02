"""
Bước 1/4 trong chat pipeline: embed câu hỏi và search Qdrant.

Auto-detect năm từ câu hỏi → filter chunk theo year range trong payload.
Ví dụ: "1945" → chỉ lấy chunk có yearStart <= 1945 <= yearEnd + 2.
"""
import re
from qdrant_client.models import ScoredPoint

from app.config import settings
from app.services.embedding_service import embed_query
from app.vectorstore.vector_repository import search
from typing import Optional


def _extract_year_from_question(question: str) -> int | None:
    matches = re.findall(r'\b(1[89]\d{2}|20\d{2})\b', question)
    if matches:
        return int(matches[0])
    return None


def retrieve(
    question: str,
    top_k: int,
    source_ids: list[int] | None = None,
    tag_ids: list[int] | None = None,
    folder_id: Optional[int] = None,
    user_id: Optional[int] = None,
) -> list[ScoredPoint]:
    year = _extract_year_from_question(question)
    # Boost query với năm nếu có
    if year:
        question = f"{question} năm {year}"

    query_vector = embed_query(question)
    return search(
        collection=settings.qdrant_collection,
        query_vector=query_vector,
        top_k=top_k,
        score_threshold=settings.score_threshold,
        source_ids=source_ids,
        tag_ids=tag_ids,
        folder_id=folder_id,
        user_id=user_id,
        question_year=year,
    )
