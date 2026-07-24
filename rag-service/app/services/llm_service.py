"""
Bước 3/4 trong chat pipeline: gọi LLM sinh câu trả lời.

Vai trò: nhận system_prompt + user_message đã được prompt_service build,
gọi LLM (Cerebras chính → OpenRouter → Groq fallback cuối), trả về answer string.

Flow: Cerebras → nếu lỗi → OpenRouter (Gemini 2.5 Flash) → nếu lỗi → Groq

Flow trong /rag/chat:
  prompt_service  →  (system_prompt, user_message)
    → generate(system_prompt, user_message, temperature)
    → answer  →  citation_service

Raise ValueError nếu cả 3 provider đều trả rỗng.
"""
import json
import logging
import re

import httpx

from app.config import settings
from app.schemas.config import AiConfig

logger = logging.getLogger("rag.llm")

def _get_providers(ai_config: AiConfig = None) -> list[str]:
    preferred = ai_config.active_llm_provider.lower() if ai_config and ai_config.active_llm_provider else settings.llm_provider.lower()
    providers = [preferred]
    for p in ["cerebras", "openrouter", "groq"]:
        if p != preferred:
            providers.append(p)
    return providers


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


def generate(system_prompt: str, user_message: str, temperature: float = 0.2, ai_config: AiConfig = None) -> str:
    last_err = None
    for p in _get_providers(ai_config):
        try:
            if p == "cerebras":
                return _clean_text(_generate_cerebras(system_prompt, user_message, temperature, ai_config))
            elif p == "openrouter":
                return _clean_text(_generate_openrouter(system_prompt, user_message, temperature))
            elif p == "groq":
                return _clean_text(_generate_groq(system_prompt, user_message, temperature))
        except Exception as e:
            logger.warning("%s failed, falling back: %s", p, e)
            last_err = e
    raise ValueError(f"All LLM providers failed. Last error: {last_err}")


def generate_with_wikipedia(system_prompt: str, user_message: str, temperature: float = 0.2, ai_config: AiConfig = None) -> str:
    # MVP: Fallback to standard generate
    # In future, this can be enhanced to perform an iterative tool-call loop with wikipedia_service
    return generate(system_prompt, user_message, temperature, ai_config=ai_config)


def generate_stream(system_prompt: str, user_message: str, temperature: float = 0.2, ai_config: AiConfig = None):
    last_err = None
    for p in _get_providers(ai_config):
        try:
            if p == "cerebras":
                for text in _stream_cerebras(system_prompt, user_message, temperature, ai_config):
                    yield text
                return
            elif p == "openrouter":
                for text in _stream_openrouter(system_prompt, user_message, temperature):
                    yield text
                return
            elif p == "groq":
                for text in _stream_groq(system_prompt, user_message, temperature):
                    yield text
                return
        except Exception as e:
            logger.warning("%s stream failed, falling back: %s", p, e)
            last_err = e
    raise ValueError(f"All LLM stream providers failed. Last error: {last_err}")


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


def _generate_cerebras(system_prompt: str, user_message: str, temperature: float, ai_config: AiConfig = None) -> str:
    payload = _openai_payload(settings.cerebras_model, system_prompt, user_message, temperature, stream=False)
    api_key = ai_config.cerebras_api_key if ai_config and ai_config.cerebras_api_key else settings.cerebras_api_key
    with httpx.Client(timeout=120) as client:
        resp = client.post(
            f"{settings.cerebras_base_url}/chat/completions",
            headers=_openai_headers(api_key),
            json=payload,
        )
        resp.raise_for_status()
        text = _parse_openai_response(resp.json())
    if not text:
        raise ValueError("Cerebras returned empty response")
    return text


def _stream_cerebras(system_prompt: str, user_message: str, temperature: float, ai_config: AiConfig = None):
    payload = _openai_payload(settings.cerebras_model, system_prompt, user_message, temperature, stream=True)
    api_key = ai_config.cerebras_api_key if ai_config and ai_config.cerebras_api_key else settings.cerebras_api_key
    with httpx.Client(timeout=120) as client:
        with client.stream(
            "POST",
            f"{settings.cerebras_base_url}/chat/completions",
            headers=_openai_headers(api_key),
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


# ─── Groq fallback cuối ─────────────────────────────────────────────────────


def _generate_groq(system_prompt: str, user_message: str, temperature: float) -> str:
    payload = _openai_payload(settings.groq_model, system_prompt, user_message, temperature, stream=False)
    with httpx.Client(timeout=120) as client:
        resp = client.post(
            f"{settings.groq_base_url}/chat/completions",
            headers=_openai_headers(settings.groq_api_key),
            json=payload,
        )
        resp.raise_for_status()
        text = _parse_openai_response(resp.json())
    if not text:
        raise ValueError("Groq returned empty response")
    return text


def _stream_groq(system_prompt: str, user_message: str, temperature: float):
    payload = _openai_payload(settings.groq_model, system_prompt, user_message, temperature, stream=True)
    with httpx.Client(timeout=120) as client:
        with client.stream(
            "POST",
            f"{settings.groq_base_url}/chat/completions",
            headers=_openai_headers(settings.groq_api_key),
            json=payload,
        ) as resp:
            resp.raise_for_status()
            yield from _stream_openai_lines(resp)
