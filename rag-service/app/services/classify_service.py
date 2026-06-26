"""
Kiểm tra xem tài liệu upload có phải tài liệu lịch sử hay không.

Flow: extract mẫu text → gọi LLM với classify prompt → parse JSON → trả kết quả.
Fail-open: nếu LLM lỗi hoặc parse lỗi → isHistory=True, label="UNKNOWN"
để tránh chặn nhầm tài liệu hợp lệ khi LLM trục trặc.
"""
import json
import re
from pathlib import Path

from app.schemas.classify import RagClassifyRequest, RagClassifyResponse
from app.services.extract_service import extract
from app.services.llm_service import generate

_CLASSIFY_PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "classify_prompt.txt"
_SAMPLE_MAX_CHARS = 5000


def load_classify_prompt() -> str:
    return _CLASSIFY_PROMPT_PATH.read_text(encoding="utf-8").strip()


def classify(req: RagClassifyRequest) -> RagClassifyResponse:
    pages = extract(
        raw_content=req.rawContent,
        file_path=req.filePath,
        source_url=req.sourceUrl,
    )

    sample = _build_sample(pages)

    if not sample:
        return RagClassifyResponse(
            sourceId=req.sourceId,
            isHistory=False,
            confidence=1.0,
            label="NOT_HISTORY",
            reason="Không trích xuất được nội dung văn bản từ file (có thể là PDF scan ảnh).",
        )

    try:
        system_prompt = load_classify_prompt()
        title_hint = f'Tiêu đề tài liệu: "{req.title}"\n\n' if req.title else ""
        user_message = f"{title_hint}Văn bản mẫu cần phân loại:\n{sample}"

        raw = generate(system_prompt, user_message, temperature=0.0)
        return _parse_response(req.sourceId, raw)
    except Exception:
        return RagClassifyResponse(
            sourceId=req.sourceId,
            isHistory=True,
            confidence=0.0,
            label="UNKNOWN",
            reason="Không kiểm duyệt được do lỗi hệ thống, tạm chấp nhận tài liệu.",
        )


def _build_sample(pages) -> str:
    texts = [p.text for p in pages if p.text]
    combined = "\n\n".join(texts)
    return combined[:_SAMPLE_MAX_CHARS]


def _parse_response(source_id: int, raw: str) -> RagClassifyResponse:
    cleaned = raw.strip()
    cleaned = re.sub(r"^```[a-z]*\n?", "", cleaned)
    cleaned = re.sub(r"\n?```$", "", cleaned)

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in LLM output: {raw!r}")

    data = json.loads(match.group())
    is_history = bool(data.get("isHistory", True))
    confidence = float(data.get("confidence", 0.5))
    reason = str(data.get("reason", ""))
    label = "HISTORY" if is_history else "NOT_HISTORY"

    return RagClassifyResponse(
        sourceId=source_id,
        isHistory=is_history,
        confidence=confidence,
        label=label,
        reason=reason,
    )
