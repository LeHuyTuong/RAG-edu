"""
Adapter thao tác dữ liệu với Qdrant: upsert / search / delete.

Vai trò: tầng dữ liệu duy nhất biết về Qdrant SDK — các service layer gọi
vào đây mà không cần biết chi tiết về SDK. Không chứa logic prompt hay citation.

3 thao tác chính:
  upsert()              — lưu vector + payload sau khi ingest (bước 4/4 pipeline)
  search()              — tìm topK chunk theo cosine similarity, hỗ trợ filter
  delete_by_source_id() — xóa toàn bộ vector của 1 source (re-ingest hoặc xóa nguồn)

Flow ingest:
  ingest_service  →  upsert(ids, vectors, payloads)  →  Qdrant Cloud

Flow chat:
  retrieval_service  →  search(query_vector, top_k, filters)  →  [ScoredPoint, ...]  →  citation_service
"""
import uuid

from qdrant_client.models import (
    FieldCondition,
    Filter,
    FilterSelector,
    MatchAny,
    MatchValue,
    PointStruct,
    Range,
    ScoredPoint,
)

from app.vectorstore.qdrant_client import get_client
from typing import Optional


def point_id(source_id: int, chunk_index: int) -> str:
    """
    Point ID phải là UUID (ràng buộc của Qdrant). Dùng UUID5 deterministic từ
    sourceId + chunkIndex để cùng một chunk luôn ra cùng một ID — re-ingest
    sẽ ghi đè point cũ thay vì tạo bản sao.
    """
    return str(uuid.uuid5(uuid.NAMESPACE_OID, f"source:{source_id}:chunk:{chunk_index}"))


def upsert(
    collection: str,
    ids: list[str],
    vectors: list[list[float]],
    payloads: list[dict],
) -> None:
    points = [
        PointStruct(id=ids[i], vector=vectors[i], payload=payloads[i])
        for i in range(len(ids))
    ]
    # wait=True: chỉ trả về khi Qdrant đã ghi xong — backend nhận COMPLETED
    # là dữ liệu chắc chắn search được ngay, không bị eventual consistency.
    get_client().upsert(collection_name=collection, points=points, wait=True)


def search(
    collection: str,
    query_vector: list[float],
    top_k: int,
    score_threshold: Optional[float] = None,
    source_ids: list[int] | None = None,
    tag_ids: list[int] | None = None,
    folder_id: Optional[int] = None,
    user_id: Optional[int] = None,
    question_year: Optional[int] = None,
) -> list[ScoredPoint]:
    """
    Search topK chunk gần nhất, kèm filter metadata nếu backend yêu cầu.
    MatchAny = điều kiện OR trong từng field; giữa các field là AND.
    MatchValue = exact match cho folderId/userId.
    Range = lọc chunk theo năm (yearStart <= question_year <= yearEnd + 2, hoặc không có năm thì skip filter).
    """
    must: list[FieldCondition] = []
    if source_ids:
        must.append(FieldCondition(key="sourceId", match=MatchAny(any=source_ids)))
    if tag_ids:
        must.append(FieldCondition(key="tagIds", match=MatchAny(any=tag_ids)))
    if folder_id is not None:
        must.append(FieldCondition(key="folderId", match=MatchValue(value=folder_id)))
    if user_id is not None:
        must.append(FieldCondition(key="userId", match=MatchValue(value=user_id)))

    should: list[FieldCondition] = []

    result = get_client().query_points(
        collection_name=collection,
        query=query_vector,
        limit=top_k,
        query_filter=Filter(must=must) if must else None,
        score_threshold=score_threshold,
        with_payload=True,
    )
    return result.points


def delete_by_source_id(collection: str, source_id: int) -> None:
    """Xóa toàn bộ vector của một source — dùng khi source bị delete hoặc trước khi re-ingest (docs/09)."""
    get_client().delete(
        collection_name=collection,
        points_selector=FilterSelector(
            filter=Filter(
                must=[FieldCondition(key="sourceId", match=MatchAny(any=[source_id]))]
            )
        ),
        wait=True,
    )
