"""
Bước 3/4 trong chat pipeline: gọi LLM sinh câu trả lời.

Vai trò: nhận system_prompt + user_message đã được prompt_service build,
gọi LLM (Cerebras chính → OpenRouter fallback), trả về answer string.

Flow: Cerebras → nếu lỗi → OpenRouter (Gemini 2.5 Flash)

Flow trong /rag/chat:
  prompt_service  →  (system_prompt, user_message)
    → generate(system_prompt, user_message, temperature)
    → answer  →  citation_service

Raise ValueError nếu cả 2 provider đều trả rỗng.
"""
import json
import logging
import re

import httpx

from app.config import settings

logger = logging.getLogger("rag.llm")


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
    # Thử Cerebras trước
    try:
        return _clean_text(_generate_cerebras(system_prompt, user_message, temperature))
    except Exception as e:
        logger.warning("Cerebras failed, falling back to Gemini: %s", e)

    # Fallback sang OpenRouter (Gemini 2.5 Flash)
    return _clean_text(_generate_openrouter(system_prompt, user_message, temperature))


def generate_stream(system_prompt: str, user_message: str, temperature: float = 0.2):
    # Thử Cerebras trước
    try:
        for text in _stream_cerebras(system_prompt, user_message, temperature):
            yield text
        return
    except Exception as e:
        logger.warning("Cerebras stream failed, falling back to Gemini: %s", e)

    # Fallback sang OpenRouter (Gemini 2.5 Flash)
    for text in _stream_openrouter(system_prompt, user_message, temperature):
        yield text


# ─── OpenAI-compatible helpers ──────────────────────────────────────────────


def _openai_headers(api_key: str) -> dict:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def _openai_payload(model: str, system_prompt: str, user_message: str, temperature: float, stream: bool) -> dict:
    return {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": temperature,
        "stream": stream,
    }


def _parse_openai_response(data: dict) -> str:
    text = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
    return (text or "").strip()


def _stream_openai_lines(resp: httpx.Response):
    """Generator yield từng delta text từ SSE stream OpenAI-compatible."""
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
        delta = (chunk.get("choices") or [{}])[0].get("delta", {}).get("content", "")
        if delta:
            has_text = True
            yield delta
    if not has_text:
        raise ValueError("LLM stream returned empty")


# ─── Cerebras (OpenAI-compatible) ───────────────────────────────────────────


def _generate_cerebras(system_prompt: str, user_message: str, temperature: float) -> str:
    payload = _openai_payload(settings.cerebras_model, system_prompt, user_message, temperature, stream=False)
    with httpx.Client(timeout=120) as client:
        resp = client.post(
            f"{settings.cerebras_base_url}/chat/completions",
            headers=_openai_headers(settings.cerebras_api_key),
            json=payload,
        )
        resp.raise_for_status()
        text = _parse_openai_response(resp.json())
    if not text:
        raise ValueError("Cerebras returned empty response")
    return text


def _stream_cerebras(system_prompt: str, user_message: str, temperature: float):
    payload = _openai_payload(settings.cerebras_model, system_prompt, user_message, temperature, stream=True)
    with httpx.Client(timeout=120) as client:
        with client.stream(
            "POST",
            f"{settings.cerebras_base_url}/chat/completions",
            headers=_openai_headers(settings.cerebras_api_key),
            json=payload,
        ) as resp:
            resp.raise_for_status()
            yield from _stream_openai_lines(resp)


# ─── OpenRouter fallback (Gemini 2.5 Flash — tiếng Việt tốt nhất) ───────────


def _openrouter_headers() -> dict:
    return _openai_headers(settings.openrouter_api_key)


def _generate_openrouter(system_prompt: str, user_message: str, temperature: float) -> str:
    payload = _openai_payload(settings.openrouter_model, system_prompt, user_message, temperature, stream=False)
    with httpx.Client(timeout=120) as client:
        resp = client.post(
            f"{settings.openrouter_base_url}/chat/completions",
            headers=_openrouter_headers(),
            json=payload,
        )
        resp.raise_for_status()
        text = _parse_openai_response(resp.json())
    if not text:
        raise ValueError("OpenRouter returned empty response")
    return text


def _stream_openrouter(system_prompt: str, user_message: str, temperature: float):
    payload = _openai_payload(settings.openrouter_model, system_prompt, user_message, temperature, stream=True)
    with httpx.Client(timeout=120) as client:
        with client.stream(
            "POST",
            f"{settings.openrouter_base_url}/chat/completions",
            headers=_openrouter_headers(),
            json=payload,
        ) as resp:
            resp.raise_for_status()
            yield from _stream_openai_lines(resp)
