"""Tra cứu Wikipedia để làm căn cứ tham chiếu khi AI không chắc chắn về một chi tiết lịch sử.

Dùng bởi classify_service (qua llm_service.generate_with_wikipedia) như một tool-call
cho LLM, thay vì để LLM tự đoán từ trí nhớ riêng — giảm rủi ro hallucination khi
kiểm tra fact-check trên tài liệu dài, nhiều chi tiết.
"""
import logging

import httpx

logger = logging.getLogger("rag.wikipedia")

_TIMEOUT = 10
_MAX_EXTRACT_CHARS = 1500
# Wikimedia API yêu cầu User-Agent mô tả rõ, nếu không sẽ trả 403.
_HEADERS = {"User-Agent": "RAG-edu/1.0 (educational history-learning platform; classify fact-check tool)"}


def search_wikipedia(query: str, lang: str = "vi") -> str:
    """Tìm bài Wikipedia khớp nhất với query, trả về đoạn tóm tắt (extract) làm căn cứ.

    Trả về chuỗi rỗng nếu không tìm thấy hoặc lỗi mạng — caller (LLM tool loop) tự xử lý,
    không được để lỗi tra cứu chặn luồng classify chính.
    """
    lang = lang if lang in ("vi", "en") else "vi"
    base = f"https://{lang}.wikipedia.org/w/api.php"
    try:
        with httpx.Client(timeout=_TIMEOUT, headers=_HEADERS) as client:
            search_resp = client.get(base, params={
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": query,
                "srlimit": 1,
            })
            search_resp.raise_for_status()
            hits = search_resp.json().get("query", {}).get("search", [])
            if not hits:
                return ""
            title = hits[0]["title"]

            extract_resp = client.get(base, params={
                "action": "query",
                "format": "json",
                "prop": "extracts",
                "exintro": 1,
                "explaintext": 1,
                "titles": title,
            })
            extract_resp.raise_for_status()
            pages = extract_resp.json().get("query", {}).get("pages", {})
            for page in pages.values():
                extract = (page.get("extract") or "").strip()
                if extract:
                    return f"[Wikipedia ({lang}): {title}]\n{extract[:_MAX_EXTRACT_CHARS]}"
            return ""
    except Exception as exc:
        logger.warning("Wikipedia lookup failed for query=%r lang=%s: %s", query, lang, exc)
        return ""
