"""
Cấu hình tập trung của RAG service — đọc từ .env qua pydantic-settings.

Vai trò: single source of truth cho mọi giá trị cấu hình (URL, API key,
tham số pipeline). Không hard-code bất kỳ giá trị nào trong service layer.

Cách dùng trong các service/module khác:
  from app.config import settings
  settings.qdrant_url, settings.default_top_k, ...
"""
from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _find_env_file() -> str:
    """Tìm .env từ thư mục hiện tại lên tối đa 3 cấp (hỗ trợ chạy từ repo root hoặc rag-service/)."""
    cwd = Path.cwd()
    for parent in [cwd] + list(cwd.parents)[:3]:
        candidate = parent / ".env"
        if candidate.is_file():
            return str(candidate)
    return ".env"  # fallback — để pydantic-settings báo lỗi rõ nếu không tìm thấy


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_find_env_file(), extra="ignore")

    # Qdrant Cloud — kết nối qua HTTPS + API key
    qdrant_url: str
    qdrant_api_key: str
    qdrant_collection: str = "history_chunks"

    # Google AI Studio — dùng cho embedding (Gemini)
    google_api_key: str = Field(validation_alias=AliasChoices("GOOGLE_API_KEY", "LLM_API_KEY"))
    embedding_model: str = "gemini-embedding-001"
    # embedding_dim phải khớp với collection đã tạo trong Qdrant — đổi model thì phải tạo lại collection
    embedding_dim: int = 768

    # Local embedding fallback — dùng khi Gemini API hết quota hoặc lỗi
    embedding_provider: str = "gemini"  # "gemini" | "local"
    local_embedding_model: str = "keepitreal/vietnamese-sbert"

    # LLM provider — "google" (Gemma) or "cerebras" (OpenAI-compatible)
    llm_provider: str = "cerebras"
    # Google LLM (Gemma) — fallback nếu llm_provider=google
    llm_model: str = "gemma-4-31b-it"
    # Cerebras — chat LLM chính
    cerebras_api_key: str = ""
    cerebras_model: str = "gpt-oss-120b"
    cerebras_base_url: str = "https://api.cerebras.ai/v1"

    # Giá trị mặc định cho pipeline — request có thể override
    default_chunk_size: int = 800
    default_chunk_overlap: int = 120
    default_top_k: int = 5
    score_threshold: float = 0.5


settings = Settings()
