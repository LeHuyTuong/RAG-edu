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
from app.schemas.config import AiConfig

logger = logging.getLogger(__name__)

# --- Gemini clients (lazy init, xoay vòng nhiều key để né quota 429) ---
# Cache client theo từng key; nhớ key "đang dùng tốt" để khỏi bắt đầu lại từ
# key đã cạn quota mỗi lần gọi.
_gemini_clients: dict[str, object] = {}
_current_key_idx = 0


def _get_gemini_client(api_key: str):
    client = _gemini_clients.get(api_key)
    if client is None:
        from google import genai
        client = genai.Client(api_key=api_key)
        _gemini_clients[api_key] = client
    return client


def _is_quota_error(exc: Exception) -> bool:
    """429 / hết quota — trường hợp nên xoay sang key khác."""
    msg = str(exc).upper()
    return "429" in msg or "RESOURCE_EXHAUSTED" in msg or "QUOTA" in msg


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

def embed_documents(texts: list[str], ai_config: AiConfig = None) -> list[list[float]]:
    return _embed(texts, task_type="RETRIEVAL_DOCUMENT", ai_config=ai_config)


def embed_query(text: str, ai_config: AiConfig = None) -> list[float]:
    return _embed([text], task_type="RETRIEVAL_QUERY", ai_config=ai_config)[0]


# --- Internal ---

_GEMINI_BATCH_SIZE = 100


def _embed(texts: list[str], task_type: str, ai_config: AiConfig = None) -> list[list[float]]:
    if settings.embedding_provider == "local":
        return _embed_local(texts)

    # Mặc định: thử Gemini trước, fallback local nếu lỗi
    try:
        return _embed_gemini(texts, task_type, ai_config)
    except Exception as exc:
        logger.warning(
            "Gemini embedding failed (provider=%s, model=%s): %s. Falling back to local model %s.",
            settings.embedding_provider, settings.embedding_model, exc,
            settings.local_embedding_model,
        )
        return _embed_local(texts)


def _embed_gemini(texts: list[str], task_type: str, ai_config: AiConfig = None) -> list[list[float]]:
    """Embed qua Gemini, xoay vòng qua tất cả key khi gặp 429/hết quota.

    Chỉ raise (để _embed fallback sang local) khi: (a) tất cả key đều hết quota,
    hoặc (b) lỗi không phải quota. Lỗi quota trên 1 key → nhảy sang key kế và
    thử lại cùng batch đó.
    """
    global _current_key_idx
    from google.genai import types

    keys = [k.strip() for k in ai_config.gemini_api_keys.split(",") if k.strip()] if ai_config and ai_config.gemini_api_keys else settings.google_api_keys
    if not keys:
        raise RuntimeError("Không có Google API key nào được cấu hình")

    config = types.EmbedContentConfig(
        task_type=task_type,
        output_dimensionality=settings.embedding_dim,
    )

    results: list[list[float]] = []
    for i in range(0, len(texts), _GEMINI_BATCH_SIZE):
        batch = texts[i : i + _GEMINI_BATCH_SIZE]
        last_quota_error: Exception | None = None
        # thử tối đa 1 vòng qua tất cả key cho batch này
        for _ in range(len(keys)):
            api_key = keys[_current_key_idx]
            try:
                response = _get_gemini_client(api_key).models.embed_content(
                    model=settings.embedding_model,
                    contents=batch,
                    config=config,
                )
                results.extend(e.values for e in response.embeddings)
                break  # batch xong, giữ nguyên _current_key_idx cho batch/lần sau
            except Exception as exc:
                if _is_quota_error(exc):
                    last_quota_error = exc
                    prev = _current_key_idx
                    _current_key_idx = (_current_key_idx + 1) % len(keys)
                    logger.warning(
                        "Gemini key #%d hết quota (429), xoay sang key #%d (còn %d key)",
                        prev, _current_key_idx, len(keys),
                    )
                    continue
                raise  # lỗi khác quota → để _embed fallback local
        else:
            # đã thử hết tất cả key mà vẫn 429
            raise RuntimeError(
                f"Tất cả {len(keys)} Google API key đều hết quota"
            ) from last_quota_error
    return results


def _embed_local(texts: list[str]) -> list[list[float]]:
    import numpy as np
    model = _get_local_model()
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    # embeddings là np.ndarray — dùng .tolist() để convert
    return np.asarray(embeddings).tolist()
