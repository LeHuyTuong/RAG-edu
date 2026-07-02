import pytest

from app.schemas.classify import RagClassifyRequest
from app.services import classify_service
from app.services.classify_service import classify


def _req(raw_content=None, file_path=None, title=None):
    return RagClassifyRequest(sourceId=1, title=title, rawContent=raw_content, filePath=file_path)


def test_classify_history_document(monkeypatch):
    monkeypatch.setattr(
        classify_service,
        "generate",
        lambda sys, user, temperature=0.0: '{"isHistory": true, "confidence": 0.95, "reason": "Đây là tài liệu lịch sử Việt Nam."}',
    )
    result = classify(_req(raw_content="Năm 1945, Cách mạng Tháng Tám thành công."))
    assert result.isHistory is True
    assert result.label == "HISTORY"
    assert result.confidence == pytest.approx(0.95)
    assert "lịch sử" in result.reason


def test_classify_non_history_document(monkeypatch):
    monkeypatch.setattr(
        classify_service,
        "generate",
        lambda sys, user, temperature=0.0: '{"isHistory": false, "confidence": 0.98, "reason": "Đây là công thức nấu ăn, không liên quan lịch sử."}',
    )
    result = classify(_req(raw_content="Nguyên liệu: 500g thịt bò, 2 củ cà rốt..."))
    assert result.isHistory is False
    assert result.label == "NOT_HISTORY"
    assert result.confidence == pytest.approx(0.98)


def test_classify_llm_error_fails_open(monkeypatch):
    """When LLM fails completely, keyword fallback returns fail-open (UNKNOWN, confidence=0.5)."""
    def raise_error(sys, user, temperature=0.0):
        raise RuntimeError("LLM timeout")

    monkeypatch.setattr(classify_service, "generate", raise_error)
    result = classify(_req(raw_content="Some content"))
    assert result.isHistory is True
    assert result.label == "UNKNOWN"
    # keyword fallback: no keywords matched → fail-open with confidence=0.5
    assert result.confidence == pytest.approx(0.5)


def test_classify_empty_content_returns_not_history(monkeypatch):
    result = classify(_req(raw_content="   "))
    assert result.isHistory is False
    assert result.label == "NOT_HISTORY"
    assert "không trích xuất" in result.reason.lower()


def test_classify_llm_json_with_fences(monkeypatch):
    monkeypatch.setattr(
        classify_service,
        "generate",
        lambda sys, user, temperature=0.0: '```json\n{"isHistory": true, "confidence": 0.9, "reason": "Sự kiện lịch sử."}\n```',
    )
    result = classify(_req(raw_content="Chiến tranh thế giới thứ hai bắt đầu năm 1939."))
    assert result.isHistory is True
    assert result.confidence == pytest.approx(0.9)


def test_classify_llm_error_keyword_fallback_history(monkeypatch):
    """When LLM fails and content has VN history keywords, keyword fallback detects history."""
    def raise_error(sys, user, temperature=0.0):
        raise RuntimeError("Cerebras quota exceeded")

    monkeypatch.setattr(classify_service, "generate", raise_error)
    result = classify(_req(
        raw_content="Chiến tranh Đông Dương là cuộc chiến giữa Việt Minh và quân Pháp. Điện Biên Phủ năm 1954.",
        title="Lịch sử Việt Nam",
    ))
    assert result.isHistory is True
    assert result.label == "HISTORY"
    assert result.confidence > 0.5
    assert "LLM" in result.reason or "từ khóa" in result.reason


def test_classify_llm_error_keyword_fallback_non_history(monkeypatch):
    """When LLM fails and content has non-history keywords, keyword fallback detects non-history."""
    def raise_error(sys, user, temperature=0.0):
        raise RuntimeError("Cerebras quota exceeded")

    monkeypatch.setattr(classify_service, "generate", raise_error)
    result = classify(_req(
        raw_content="Công thức nấu ăn bò kho: nguyên liệu 500g thịt bò, cà rốt, quế, hồi. Discount 50% cho đơn hàng.",
    ))
    assert result.isHistory is False
    assert result.label == "NOT_HISTORY"
    assert result.confidence < 0.5
    assert "từ khóa" in result.reason or "LLM" in result.reason
