from fastapi.testclient import TestClient

from app.main import app
from app.schemas.classify import RagClassifyResponse
from app.services import classify_service

client = TestClient(app)


def test_classify_endpoint_history(monkeypatch):
    def fake_classify(req, ai_config=None, **kwargs):
        return RagClassifyResponse(
            sourceId=req.sourceId,
            isHistory=True,
            confidence=0.9,
            label="HISTORY",
            reason="Tài liệu lịch sử Việt Nam.",
        )

    monkeypatch.setattr(classify_service, "classify", fake_classify)

    response = client.post(
        "/rag/classify",
        json={"sourceId": 5, "title": "Lịch sử VN", "rawContent": "Năm 1975..."},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["isHistory"] is True
    assert data["label"] == "HISTORY"
    assert data["sourceId"] == 5


def test_classify_endpoint_not_history(monkeypatch):
    def fake_classify(req, ai_config=None, **kwargs):
        return RagClassifyResponse(
            sourceId=req.sourceId,
            isHistory=False,
            confidence=0.97,
            label="NOT_HISTORY",
            reason="Công thức nấu ăn không liên quan lịch sử.",
        )

    monkeypatch.setattr(classify_service, "classify", fake_classify)

    response = client.post(
        "/rag/classify",
        json={"sourceId": 6, "title": "Món ăn", "rawContent": "500g thịt bò..."},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["isHistory"] is False
    assert data["label"] == "NOT_HISTORY"


def test_classify_endpoint_value_error_returns_400(monkeypatch):
    def fake_classify(req, ai_config=None, **kwargs):
        raise ValueError("invalid input")

    monkeypatch.setattr(classify_service, "classify", fake_classify)

    response = client.post(
        "/rag/classify",
        json={"sourceId": 7, "rawContent": "abc"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "invalid input"


def test_classify_endpoint_unexpected_error_returns_500(monkeypatch):
    def fake_classify(req, ai_config=None, **kwargs):
        raise RuntimeError("qdrant down")

    monkeypatch.setattr(classify_service, "classify", fake_classify)

    response = client.post(
        "/rag/classify",
        json={"sourceId": 8, "rawContent": "abc"},
    )

    assert response.status_code == 500
    assert "Classify failed" in response.json()["detail"]
