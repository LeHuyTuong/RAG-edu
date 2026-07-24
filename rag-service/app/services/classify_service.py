"""
Kiểm tra xem tài liệu upload có phải tài liệu lịch sử hay không.

Flow: extract mẫu text → gọi LLM với classify prompt → parse JSON → trả kết quả.
Retry: thử lại tối đa _MAX_RETRIES lần với exponential backoff nếu LLM lỗi.
Fallback: nếu LLM hoàn toàn thất bại sau retry → dùng keyword-based classify
de tranh document bi stuck o trang thai FAILED.
"""
import json
import logging
import re
import time
from pathlib import Path

from typing import Optional

from app.schemas.classify import RagClassifyRequest, RagClassifyResponse
from app.schemas.config import AiConfig
from app.services.extract_service import extract
from app.services.llm_service import generate_with_wikipedia

logger = logging.getLogger(__name__)

_CLASSIFY_PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "classify_prompt.txt"
_SAMPLE_MAX_CHARS = 5000
_MAX_RETRIES = 2
_RETRY_BASE_DELAY = 1.0  # seconds

# ── Keyword-based fallback cho khi LLM hoàn toàn thất bại ──────────────────
# Nhóm từ khóa lịch sử Việt Nam ưu tiên cao
_VN_HISTORY_KEYWORDS = [
    # Triều đại & thời kỳ
    "hùng vương", "bắc thuộc", "ngô quyền", "đinh bộ lập", "lê hoàn",
    "lý Công Uẩn", "nhà lý", "nhà Trần", "nhà Hồ", "nhà Lê",
    "mạc Đăng Dung", "nguyễn Kim", "trịnh nguyễn phân tranh",
    "tây sơn", "nguyễn ánh", "gia định",
    "pháp thuộc", "đông dương",
    "cách mạng tháng tám", "việt minh", "chiến tranh đông dương",
    "chiến tranh việt nam", "đại chiến thế giới",
    # Nhân vật lịch sử
    "hai bà trưng", "trần Hưng Đạo", "lê Thánh Tông", "nguyễn Trãi",
    "quang Trung", "nguyễn Ái Quốc", "hồ chí minh", "vo nguyen giap",
    "võ nguyên giáp", "điện biên phủ",
    # Sự kiện & địa danh
    "bạch đằng", "đông kinh", "thăng long", "hội an", "huế",
    "đà lạt", "sài gòn", "nam kỳ", "bắc kỳ", "trung kỳ",
    "chiến thắng cơ xá", "đồng dương", "mê linh", "bà triêu",
    # Sử liệu
    "đại việt sử ký", "khâm định việt sử", "lĩnh nam chích quái",
    "việt sử tiêu án", "phủ biên tạp lục", "hoàng việt đại địa dư",
]

# Từ khóa cho tài liệu KHÔNG phải lịch sử
_NON_HISTORY_KEYWORDS = [
    "công thức nấu ăn", "ingredients", "recipe",
    "quảng cáo", "giảm giá", "sale", "discount", "khuyến mãi",
    "mã giảm giá", "coupon", "flash sale",
    "hợp đồng lao động", "điều khoản", "quy định nội quy",
    "npm install", "pip install", "import React", "def function",
    "class=", "function()", "console.log",
]


def load_classify_prompt() -> str:
    return _CLASSIFY_PROMPT_PATH.read_text(encoding="utf-8").strip()


def classify(req: RagClassifyRequest, ai_config: AiConfig = None) -> RagClassifyResponse:
    pages = extract(
        raw_content=req.rawContent,
        file_path=req.filePath,
        source_url=req.sourceUrl,
    )

    sample = _build_sample(pages)

    # Nếu không extract được text từ file, thử dùng title
    if not sample and req.title:
        sample = req.title
    elif not sample:
        return RagClassifyResponse(
            sourceId=req.sourceId,
            isHistory=False,
            confidence=1.0,
            label="NOT_HISTORY",
            reason="Không trích xuất được nội dung văn bản từ file (có thể là PDF scan ảnh).",
        )

    # Thử gọi LLM với retry
    last_error = None
    for attempt in range(_MAX_RETRIES + 1):
        try:
            system_prompt = load_classify_prompt()
            title_hint = f'Tiêu đề tài liệu: "{req.title}"\n\n' if req.title else ""
            user_message = f"{title_hint}Văn bản mẫu cần phân loại:\n{sample}"

            raw = generate_with_wikipedia(system_prompt, user_message, temperature=0.0, ai_config=ai_config)
            return _parse_response(req.sourceId, raw)
        except Exception as exc:
            last_error = exc
            if attempt < _MAX_RETRIES:
                delay = _RETRY_BASE_DELAY * (2 ** attempt)
                logger.warning(
                    "Classify attempt %d/%d failed: %s. Retrying in %.1fs...",
                    attempt + 1, _MAX_RETRIES + 1, exc, delay,
                )
                time.sleep(delay)

    # LLM hoàn toàn thất bại → dùng keyword-based fallback
    logger.error(
        "Classify LLM failed after %d retries: %s. Falling back to keyword classify.",
        _MAX_RETRIES + 1, last_error,
    )
    return _keyword_classify(req.sourceId, sample, req.title)


def _keyword_classify(source_id: int, sample: str, title: Optional[str]) -> RagClassifyResponse:
    """Keyword-based fallback khi LLM hoàn toàn thất bại.

    Dung so sanh tu khoa de uoc tinh confidence,
    giup document khong bi stuck o trang thai FAILED.
    """
    text = f"{title or ''} {sample}".lower()

    # Đếm từ khóa lịch sử Việt Nam
    vn_hits = sum(1 for kw in _VN_HISTORY_KEYWORDS if kw.lower() in text)

    # Đếm từ khóa "không phải lịch sử"
    non_history_hits = sum(1 for kw in _NON_HISTORY_KEYWORDS if kw.lower() in text)

    # Quyết định dựa trên tỷ lệ
    if vn_hits >= 3 and vn_hits > non_history_hits:
        # Nhiều từ khóa lịch sử → confidence cao
        confidence = min(0.85, 0.6 + vn_hits * 0.03)
        return RagClassifyResponse(
            sourceId=source_id,
            isHistory=True,
            confidence=confidence,
            label="HISTORY",
            reason=f"Phân tích từ khóa: phát hiện {vn_hits} từ khóa lịch sử (LLM không khả dụng).",
        )
    elif vn_hits >= 1 and non_history_hits == 0:
        # Có ít nhất 1 từ khóa lịch sử, không có từ khóa phi lịch sử
        confidence = min(0.75, 0.55 + vn_hits * 0.03)
        return RagClassifyResponse(
            sourceId=source_id,
            isHistory=True,
            confidence=confidence,
            label="HISTORY",
            reason=f"Phân tích từ khóa: phát hiện {vn_hits} từ khóa lịch sử (LLM không khả dụng).",
        )
    elif non_history_hits >= 2 and non_history_hits > vn_hits:
        # Nhiều từ khóa phi lịch sử
        confidence = max(0.15, 0.4 - non_history_hits * 0.05)
        return RagClassifyResponse(
            sourceId=source_id,
            isHistory=False,
            confidence=confidence,
            label="NOT_HISTORY",
            reason=f"Phân tích từ khóa: phát hiện {non_history_hits} từ khóa phi lịch sử (LLM không khả dụng).",
        )
    else:
        # Không đủ bằng chứng → fail-open, chấp nhận tạm thời
        return RagClassifyResponse(
            sourceId=source_id,
            isHistory=True,
            confidence=0.5,
            label="UNKNOWN",
            reason="Không phân tích được do lỗi LLM, tạm chấp nhận để admin duyệt.",
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
