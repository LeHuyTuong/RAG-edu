"""
Bước 3/4 trong chat pipeline: gọi LLM sinh câu trả lời.

Vai trò: nhận system_prompt + user_message đã được prompt_service build,
gọi LLM (Cerebras hoặc Google GenAI), trả về answer string.

Hai provider:
  - cerebras: OpenAI-compatible API qua httpx (chat chính)
  - google:   GenAI SDK (Gemma) — fallback

Flow trong /rag/chat:
  prompt_service  →  (system_prompt, user_message)
    → generate(system_prompt, user_message, temperature)
    → answer  →  citation_service

Raise ValueError nếu LLM trả rỗng — chat_routes bắt exception này
và fallback về _NO_DATA_MSG thay vì crash 500.
"""
import json
import re

import httpx

from app.config import settings


def _clean_text(text: str) -> str:
    """Loại bỏ markdown formatting: **bold**, *italic*, `code`, # heading, ---."""
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"`(.*?)`", r"\1", text)
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n-{3,}\n", "\n", text)
    text = re.sub(r"\*\*", "", text)
    text = re.sub(r"\*", "", text)
    return text.strip()


def generate(system_prompt: str, user_message: str, temperature: float = 0.2) -> str:
    provider = settings.llm_provider

    if provider == "cerebras":
        return _clean_text(_generate_cerebras(system_prompt, user_message, temperature))
    return _clean_text(_generate_google(system_prompt, user_message, temperature))


def generate_stream(system_prompt: str, user_message: str, temperature: float = 0.2):
    provider = settings.llm_provider

    if provider == "cerebras":
        for text in _stream_cerebras(system_prompt, user_message, temperature):
            yield _clean_text(text)
    else:
        for text in _stream_google(system_prompt, user_message, temperature):
            yield _clean_text(text)


# ─── Cerebras (OpenAI-compatible) ───────────────────────────────────────────


def _generate_cerebras(system_prompt: str, user_message: str, temperature: float) -> str:
    payload = _cerebras_payload(system_prompt, user_message, temperature, stream=False)

    with httpx.Client(timeout=120) as client:
        resp = client.post(
            f"{settings.cerebras_base_url}/chat/completions",
            headers=_cerebras_headers(),
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    text = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
    text = (text or "").strip()
    if not text:
        raise ValueError("Cerebras returned empty response")
    return text


def _stream_cerebras(system_prompt: str, user_message: str, temperature: float):
    payload = _cerebras_payload(system_prompt, user_message, temperature, stream=True)

    with httpx.Client(timeout=120) as client:
        with client.stream(
            "POST",
            f"{settings.cerebras_base_url}/chat/completions",
            headers=_cerebras_headers(),
            json=payload,
        ) as resp:
            resp.raise_for_status()
            has_text = False
            for line in resp.iter_lines():
                if not line.startswith("data: "):
                    continue
                chunk_data = line.removeprefix("data: ").strip()
                if chunk_data == "[DONE]":
                    break
                try:
                    chunk = json.loads(chunk_data)
                except json.JSONDecodeError:
                    continue
                delta = (
                    chunk.get("choices") or [{}]
                )[0].get("delta", {}).get("content", "")
                if delta:
                    has_text = True
                    yield delta

    if not has_text:
        raise ValueError("Cerebras returned empty stream")


def _cerebras_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.cerebras_api_key}",
        "Content-Type": "application/json",
    }


def _cerebras_payload(system_prompt: str, user_message: str, temperature: float, stream: bool) -> dict:
    return {
        "model": settings.cerebras_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": temperature,
        "stream": stream,
    }


# ─── Google GenAI (Gemma — fallback) ────────────────────────────────────────


from typing import Optional
from google import genai
from google.genai import types

_google_client: Optional[genai.Client] = None


def _get_google_client() -> genai.Client:
    global _google_client
    if _google_client is None:
        _google_client = genai.Client(api_key=settings.google_api_key)
    return _google_client


def _generate_google(system_prompt: str, user_message: str, temperature: float) -> str:
    response = _get_google_client().models.generate_content(
        model=settings.llm_model,
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
        ),
    )
    text = (response.text or "").strip()
    if not text:
        raise ValueError("LLM returned empty response")
    return text


def _stream_google(system_prompt: str, user_message: str, temperature: float):
    models = _get_google_client().models
    stream_fn = getattr(models, "generate_content_stream", None)
    if stream_fn is None:
        yield from _chunk_text(_generate_google(system_prompt, user_message, temperature))
        return

    has_text = False
    for chunk in stream_fn(
        model=settings.llm_model,
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=temperature,
        ),
    ):
        text = getattr(chunk, "text", None) or ""
        if text:
            has_text = True
            yield text

    if not has_text:
        raise ValueError("LLM returned empty stream")


def _chunk_text(text: str, chunk_size: int = 48):
    for index in range(0, len(text), chunk_size):
        yield text[index:index + chunk_size]
