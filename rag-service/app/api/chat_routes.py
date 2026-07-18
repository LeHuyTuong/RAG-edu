"""
API layer cho chat: POST /rag/chat và GET /rag/health.

Vai trò: nhận câu hỏi từ Spring Boot, chạy RAG pipeline, trả answer + citations.
Không chứa logic retrieval hay prompt — chỉ điều phối các service.

Flow trong /rag/chat:
  1. question_router_service.route()  — quyết định dùng vector / graph / cả hai
  2. retrieval_service.retrieve()     — embed câu hỏi + search Qdrant topK chunks
  3. prompt_service.build_user_msg()  — ghép câu hỏi + chunks thành prompt
  4. llm_service.generate()          — gọi Gemma LLM sinh câu trả lời
  5. citation_service.to_citations()  — map ScoredPoint → Citation objects

Fallback: nếu không có hits hoặc LLM lỗi → trả _NO_DATA_MSG thay vì crash.
Graph (Neo4j) chưa implement — useGraph luôn False trong MVP.
"""
import json
import logging

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.schemas.chat import RagChatRequest, RagChatResponse
from app.schemas.config import AiConfig, get_ai_config

router = APIRouter()
logger = logging.getLogger("rag.chat")

_NO_DATA_MSG = "Hiện tại dữ liệu trong hệ thống chưa đủ để kết luận chắc chắn về câu hỏi này."
_NO_DATA_MARKER = "hiện tại dữ liệu trong hệ thống chưa đủ để kết luận chắc chắn"


@router.get("/health")
async def health():
    return {"status": "ok", "service": "rag-history"}


@router.post("/chat", response_model=RagChatResponse)
async def chat(req: RagChatRequest, ai_config: AiConfig = Depends(get_ai_config)):
    return await _chat(req, ai_config)


@router.post("/chat/stream")
async def chat_stream(req: RagChatRequest, ai_config: AiConfig = Depends(get_ai_config)):
    async def event_stream():
        yield _sse("chat.created", {"message": "stream started"})
        async for event in _stream_chat_events(req, ai_config):
            yield event

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


async def _chat(req: RagChatRequest, ai_config: AiConfig) -> RagChatResponse:
    from app.config import settings
    from app.services.retrieval_service import retrieve
    from app.services.prompt_service import load_system_prompt, build_user_message
    from app.services.llm_service import generate
    from app.services.citation_service import to_citations
    from app.services.question_router_service import route

    top_k = req.topK or settings.default_top_k
    routing = route(req.question, req.useGraph)

    hits = []
    if routing["use_vector"]:
        hits = retrieve(
            question=req.question,
            top_k=top_k,
            source_ids=req.sourceIds or None,
            tag_ids=req.tagIds or None,
            folder_id=req.folderId,
            user_id=req.userId,
        )

    if not hits:
        return RagChatResponse(
            answer=_NO_DATA_MSG,
            citations=[],
            usedVector=routing["use_vector"],
            usedGraph=False,
        )

    try:
        system_prompt = load_system_prompt()
        user_message = build_user_message(req.question, hits)
        answer = generate(system_prompt, user_message, req.temperature, ai_config)
    except Exception:
        logger.exception("LLM generate failed for question=%r", req.question)
        citations = to_citations(hits)
        return RagChatResponse(
            answer=_extractive_answer(req.question, hits),
            citations=citations,
            usedVector=True,
            usedGraph=False,
        )

    return RagChatResponse(
        answer=answer,
        citations=[] if _is_no_data_answer(answer) else to_citations(hits),
        usedVector=True,
        usedGraph=False,
    )


async def _stream_chat_events(req: RagChatRequest, ai_config: AiConfig):
    from app.config import settings
    from app.services.retrieval_service import retrieve
    from app.services.prompt_service import load_system_prompt, build_user_message
    from app.services.llm_service import generate_stream
    from app.services.citation_service import to_citations
    from app.services.question_router_service import route

    top_k = req.topK or settings.default_top_k
    routing = route(req.question, req.useGraph)

    hits = []
    if routing["use_vector"]:
        hits = retrieve(
            question=req.question,
            top_k=top_k,
            source_ids=req.sourceIds or None,
            tag_ids=req.tagIds or None,
            folder_id=req.folderId,
            user_id=req.userId,
        )

    if not hits:
        for event in _answer_events(_NO_DATA_MSG, [], routing["use_vector"], False):
            yield event
        return

    answer_chunks = []
    try:
        system_prompt = load_system_prompt()
        user_message = build_user_message(req.question, hits)
        for chunk in generate_stream(system_prompt, user_message, req.temperature, ai_config):
            answer_chunks.append(chunk)
            yield _sse("chat.delta", {"text": chunk})
    except Exception:
        logger.exception("LLM generate_stream failed for question=%r", req.question)
        citations = to_citations(hits)
        for event in _answer_events(_extractive_answer(req.question, hits), citations, True, False):
            yield event
        return

    answer = "".join(answer_chunks)
    citations = [] if _is_no_data_answer(answer) else to_citations(hits)
    yield _sse("chat.citations", {
        "citations": [citation.model_dump() for citation in citations],
    })
    yield _sse("chat.completed", {
        "usedVector": True,
        "usedGraph": False,
    })


def _answer_events(answer: str, citations: list, used_vector: bool, used_graph: bool):
    for chunk in _chunk_text(answer):
        yield _sse("chat.delta", {"text": chunk})
    yield _sse("chat.citations", {
        "citations": [citation.model_dump() for citation in citations],
    })
    yield _sse("chat.completed", {
        "usedVector": used_vector,
        "usedGraph": used_graph,
    })


def _sse(event: str, data: dict) -> str:
    payload = json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"


def _is_no_data_answer(answer: str) -> bool:
    normalized = " ".join((answer or "").strip().lower().split())
    return _NO_DATA_MARKER in normalized


def _chunk_text(text: str, chunk_size: int = 48):
    if not text:
        return
    for index in range(0, len(text), chunk_size):
        yield text[index:index + chunk_size]


def _extractive_answer(question: str, hits: list) -> str:
    snippets = []
    for hit in hits[:3]:
        payload = hit.payload or {}
        text = (payload.get("chunkText") or "").strip()
        if text:
            title = payload.get("title") or "Tài liệu tham khảo"
            source_type = payload.get("sourceType") or ""
            source_id = payload.get("sourceId")
            snippet = " ".join(text.split())[:700]
            snippets.append((title, source_type, source_id, snippet))

    if not snippets:
        return _NO_DATA_MSG

    parts = [
        "[Hệ thống AI tạm thời không khả dụng]",
        "",
        f"Câu hỏi: \"{question}\"",
        "",
        "Hệ thống đã tìm ra các đoạn tư liệu dưới đây. "
        "Đây là nguyên văn từ tài liệu gốc, chưa qua tổng hợp. "
        "Bạn có thể dựa vào đó để tự trả lời.",
        "",
        "—— CÁC ĐOẠN TƯ LIỆU LIÊN QUAN ——",
    ]

    for i, (title, source_type, source_id, snippet) in enumerate(snippets, start=1):
        loc = f"  Nguồn: {title}"
        if source_type:
            ref = source_type
            if source_id:
                ref += f" #{source_id}"
            loc += f" ({ref})"
        parts.append("")
        parts.append(f"[Đoạn {i}]")
        parts.append(loc)
        parts.append("  " + "-" * 40)
        parts.append(snippet)

    parts.append("")
    parts.append("——")
    parts.append("")
    parts.append(
        "Các tư liệu trên được trích nguyên văn từ tài liệu gốc, "
        "chưa qua tổng hợp. Hãy đọc kỹ và tự suy luận câu trả lời. "
        "Thử lại sau nếu muốn AI tổng hợp giúp bạn."
    )

    return "\n".join(parts)
