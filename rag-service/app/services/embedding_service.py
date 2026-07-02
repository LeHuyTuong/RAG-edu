"""
Bước 3/4 trong ingestion pipeline: tạo vector embedding cho text.

Hỗ trợ 2 provider:
  - gemini (mặc định): Google Gemini Embedding API — tách RETRIEVAL_DOCUMENT / RETRIEVAL_QUERY
  - local (fallback): sentence-transformers với model tiếng Việt "keepitreal/vietnamese-sbert"
    Tự động fallback từ Gemini → local nếu Gemini API lỗi (hết quota, network error, ...)

Flow trong ingest:
  chunk_service  →  [ChunkData]  →  embed_documents(texts)  →  [vector, ...]  →  vector_repository

Flow trong chat:
  chat_routes  →  embed_query(question)  →  [vector]  →  vector_repository.search()
"""
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# --- Gemini client (lazy init) ---
_gemini_client = None


def _get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        from google import genai
        _gemini_client = genai.Client(api_key=settings.google_api_key)
    return _gemini_client


# --- Local model (lazy init, singleton) ---
_local_model = None


def _get_local_model():
    global _local_model
    if _local_model is None:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading local embedding model: %s", settings.local_embedding_model)
        _local_model = SentenceTransformer(settings.local_embedding_model)
    return _local_model


# --- Public API ---

def embed_documents(texts: list[str]) -> list[list[float]]:
    return _embed(texts, task_type="RETRIEVAL_DOCUMENT")


def embed_query(text: str) -> list[float]:
    return _embed([text], task_type="RETRIEVAL_QUERY")[0]


# --- Internal ---

_GEMINI_BATCH_SIZE = 100


def _embed(texts: list[str], task_type: str) -> list[list[float]]:
    if settings.embedding_provider == "local":
        return _embed_local(texts)

    # Mặc định: thử Gemini trước, fallback local nếu lỗi
    try:
        return _embed_gemini(texts, task_type)
    except Exception as exc:
        logger.warning(
            "Gemini embedding failed (provider=%s, model=%s): %s. Falling back to local model %s.",
            settings.embedding_provider, settings.embedding_model, exc,
            settings.local_embedding_model,
        )
        return _embed_local(texts)


def _embed_gemini(texts: list[str], task_type: str) -> list[list[float]]:
    from google.genai import types

    client = _get_gemini_client()
    results: list[list[float]] = []
    for i in range(0, len(texts), _GEMINI_BATCH_SIZE):
        batch = texts[i : i + _GEMINI_BATCH_SIZE]
        response = client.models.embed_content(
            model=settings.embedding_model,
            contents=batch,
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=settings.embedding_dim,
            ),
        )
        results.extend(e.values for e in response.embeddings)
    return results


def _embed_local(texts: list[str]) -> list[list[float]]:
    import numpy as np
    model = _get_local_model()
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    # embeddings là np.ndarray — dùng .tolist() để convert
    return np.asarray(embeddings).tolist()
