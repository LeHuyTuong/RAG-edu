from types import SimpleNamespace
import numpy as np

from app.services import embedding_service


class FakeEmbedding:
    def __init__(self, values):
        self.values = values


class FakeModels:
    def __init__(self):
        self.calls = []

    def embed_content(self, model, contents, config):
        self.calls.append({
            "model": model,
            "contents": list(contents),
            "task_type": config.task_type,
            "output_dimensionality": config.output_dimensionality,
        })
        return SimpleNamespace(
            embeddings=[
                FakeEmbedding([float(len(self.calls)), float(index)])
                for index, _ in enumerate(contents)
            ]
        )


class FakeLocalModel:
    def encode(self, texts, normalize_embeddings, show_progress_bar):
        return np.array([[float(i)] * 3 for i in range(len(texts))])


def test_embed_documents_batches_requests_and_uses_document_task(monkeypatch):
    models = FakeModels()
    monkeypatch.setattr(embedding_service, "_get_gemini_client", lambda: SimpleNamespace(models=models))
    monkeypatch.setattr(embedding_service.settings, "embedding_model", "embed-test")
    monkeypatch.setattr(embedding_service.settings, "embedding_dim", 3)
    monkeypatch.setattr(embedding_service.settings, "embedding_provider", "gemini")

    vectors = embedding_service.embed_documents([f"text-{index}" for index in range(101)])

    assert len(vectors) == 101
    assert [len(call["contents"]) for call in models.calls] == [100, 1]
    assert {call["task_type"] for call in models.calls} == {"RETRIEVAL_DOCUMENT"}
    assert {call["model"] for call in models.calls} == {"embed-test"}
    assert {call["output_dimensionality"] for call in models.calls} == {3}


def test_embed_query_uses_query_task(monkeypatch):
    models = FakeModels()
    monkeypatch.setattr(embedding_service, "_get_gemini_client", lambda: SimpleNamespace(models=models))

    vector = embedding_service.embed_query("Nha Tran thanh lap nam nao?")

    assert vector == [1.0, 0.0]
    assert models.calls[0]["task_type"] == "RETRIEVAL_QUERY"


def test_embed_falls_back_to_local_when_gemini_fails(monkeypatch):
    """Khi Gemini lỗi, phải fallback sang local model."""
    monkeypatch.setattr(embedding_service.settings, "embedding_provider", "gemini")

    # Mock Gemini để throw exception
    def failing_gemini(texts, task_type):
        raise RuntimeError("Gemini API quota exceeded")

    monkeypatch.setattr(embedding_service, "_embed_gemini", failing_gemini)

    # Mock local model
    class FakeLocalModel:
        def encode(self, texts, normalize_embeddings, show_progress_bar):
            return [[float(i)] * 3 for i in range(len(texts))]

    monkeypatch.setattr(embedding_service, "_get_local_model", lambda: FakeLocalModel())

    vectors = embedding_service.embed_documents(["text-1", "text-2"])
    assert len(vectors) == 2
    assert len(vectors[0]) == 3


def test_embed_uses_local_provider_directly(monkeypatch):
    """Khi embedding_provider='local', phải dùng local model trực tiếp."""
    monkeypatch.setattr(embedding_service.settings, "embedding_provider", "local")

    class FakeLocalModel:
        def encode(self, texts, normalize_embeddings, show_progress_bar):
            return [[float(i)] * 3 for i in range(len(texts))]

    monkeypatch.setattr(embedding_service, "_get_local_model", lambda: FakeLocalModel())

    vectors = embedding_service.embed_documents(["text-1"])
    assert len(vectors) == 1
    assert len(vectors[0]) == 3
