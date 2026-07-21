"""
Bước 4/4 trong ingestion pipeline: orchestrator kết nối toàn bộ luồng xử lý.

Vai trò: điều phối 4 bước extract → chunk → embed → upsert thành 1 flow
hoàn chỉnh. ingest_routes.py gọi hàm ingest() ở đây và nhận về response
để trả về Spring Boot.

Flow đầy đủ:
  ingest_routes
    → ingest(req)
      1. extract_service.extract()      — lấy text thô từ file/URL/rawContent
      2. chunk_service.chunk()          — split thành chunk có overlap
      3. embedding_service.embed_docs() — tạo vector cho từng chunk
      4. vector_repository.upsert()     — lưu vào Qdrant Cloud
    → RagIngestResponse(status, chunks[])

Re-ingest: xóa vector cũ trước khi upsert (delete_by_source_id) để tránh
tạo bản sao — đây là lý do delete đứng trước upsert trong flow.

Trả "EMPTY" nếu không extract được chunk, "COMPLETED" nếu thành công.
Exception từ bất kỳ bước nào sẽ bubble lên ingest_routes và trả 500.
"""
import hashlib
import re
from datetime import datetime, timezone

from app.config import settings
from app.schemas.ingest import IngestedChunk, RagIngestRequest, RagIngestResponse
from app.services.chunk_service import chunk
from app.services.embedding_service import embed_documents
from app.services.extract_service import extract
from app.vectorstore.qdrant_client import ensure_collection
from app.vectorstore.vector_repository import delete_by_source_id, point_id, upsert
from app.schemas.config import AiConfig
from typing import Optional


def _parse_year_range(title: str) -> tuple[int | None, int | None]:
    """Trích năm từ title: 'năm 1945-1950' → (1945, 1950), '1954' → (1954, 1954)"""
    if not title:
        return None, None
    matches = re.findall(r'(\d{4})', title)
    if len(matches) >= 2:
        y1, y2 = int(matches[0]), int(matches[-1])
        if abs(y2 - y1) <= 100:
            return min(y1, y2), max(y1, y2)
    if matches:
        y = int(matches[0])
        if 1900 <= y <= 2100:
            return y, y
    return None, None


def ingest(req: RagIngestRequest, ai_config: AiConfig = None) -> RagIngestResponse:
    chunk_size = req.settings.chunkSize or settings.default_chunk_size
    chunk_overlap = req.settings.chunkOverlap or settings.default_chunk_overlap
    collection = settings.qdrant_collection

    pages = extract(
        raw_content=req.rawContent,
        file_path=req.filePath,
        source_url=req.sourceUrl,
    )

    full_text = " ".join(p.text for p in pages)
    normalized = re.sub(r"\s+", " ", full_text).strip().lower()
    document_content_hash = hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    chunks = chunk(pages, chunk_size, chunk_overlap)

    if not chunks:
        return RagIngestResponse(
            sourceId=req.sourceId,
            status="EMPTY",
            collection=collection,
            embeddingModel=settings.embedding_model,
            documentContentHash=document_content_hash,
            chunks=[],
        )

    texts = [c.text for c in chunks]
    vectors = embed_documents(texts, ai_config)

    created_at = datetime.now(timezone.utc).isoformat()
    # Chỉ upsert vector + metadata gọn (bỏ chunkText để tránh vượt 32MB limit)
    ids = [point_id(req.sourceId, c.chunk_index) for c in chunks]

    # Trích năm từ title để lưu vào payload → filter khi search
    year_start, year_end = _parse_year_range(req.title)

    ensure_collection(collection)
    delete_by_source_id(collection, req.sourceId)

    BATCH_SIZE = 100
    for i in range(0, len(chunks), BATCH_SIZE):
        batch_ids = ids[i:i + BATCH_SIZE]
        batch_vectors = vectors[i:i + BATCH_SIZE]
        batch_payloads = [
            {
                "sourceId": req.sourceId,
                "sourceType": req.sourceType,
                "documentId": req.documentId,
                "folderId": req.metadata.folderId,
                "userId": req.metadata.userId,
                "title": req.title,
                "chunkIndex": chunks[j].chunk_index,
                "pageNumber": chunks[j].page_number,
                "chunkText": chunks[j].text[:2000],
                "yearStart": year_start,
                "yearEnd": year_end,
                "createdAt": created_at,
            }
            for j in range(i, min(i + BATCH_SIZE, len(chunks)))
        ]
        upsert(collection, batch_ids, batch_vectors, batch_payloads)

    return RagIngestResponse(
        sourceId=req.sourceId,
        status="COMPLETED",
        collection=collection,
        embeddingModel=settings.embedding_model,
        documentContentHash=document_content_hash,
        chunks=[
            IngestedChunk(
                chunkIndex=chunks[i].chunk_index,
                qdrantPointId=ids[i],
                contentHash=chunks[i].content_hash,
            )
            for i in range(len(chunks))
        ],
    )


def _build_payload(
    req: RagIngestRequest,
    chunk_index: int,
    page_number: Optional[int],
    text: str,
    created_at: str,
) -> dict:
    """
    Flatten metadata vào payload Qdrant để filter lúc search không cần JOIN MySQL.
    Cấu trúc bám sát "Metadata chunk bắt buộc" trong docs/09.
    """
    return {
        # --- định danh nguồn ---
        "sourceId": req.sourceId,
        "sourceType": req.sourceType,
        "articleId": req.articleId,
        "documentId": req.documentId,
        "sourceUrl": req.sourceUrl,
        "filePath": req.filePath,
        # --- vị trí chunk ---
        "chunkIndex": chunk_index,
        "pageNumber": page_number,
        "chunkText": text,
        # --- metadata từ Spring Boot (đã denormalize) ---
        "title": req.title,
        "categoryId": req.metadata.categoryId,
        "categoryName": req.metadata.categoryName,
        "slug": req.metadata.slug,
        "tagIds": req.metadata.tagIds,
        "eventIds": req.metadata.eventIds,
        "periodIds": req.metadata.periodIds,
        "folderId": req.metadata.folderId,
        "userId": req.metadata.userId,
        # --- audit ---
        "createdAt": created_at,
    }
