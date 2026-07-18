"""
Bước 1/4 trong ingestion pipeline: extract text thô từ nhiều loại nguồn.

Vai trò: nhận input (rawContent / filePath / sourceUrl) và chuẩn hóa về
list[PageText] để chunk_service xử lý ở bước tiếp theo.

Flow:
  ingest_service  →  extract()  →  [PageText, ...]  →  chunk_service

Ưu tiên input: rawContent > filePath > sourceUrl
  rawContent  — article/manual input, Spring Boot gửi thẳng text
  filePath    — file đã upload lên server (PDF, DOCX, TXT, MD)
  sourceUrl   — fetch HTML, strip boilerplate, lấy body text

Giữ page_number riêng cho PDF vì citation cần số trang (docs/14).
"""
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass
class PageText:
    """Đơn vị text sau extract. page_number=None với nguồn không có khái niệm trang."""
    page_number: Optional[int]
    text: str


def extract(
    raw_content: Optional[str] = None,
    file_path: Optional[str] = None,
    source_url: Optional[str] = None,
) -> list[PageText]:
    """
    Ưu tiên: rawContent > filePath > sourceUrl.
    rawContent dùng cho article/manual input — Spring Boot gửi thẳng text, không cần đọc file.
    """
    if raw_content:
        return [PageText(page_number=None, text=raw_content.strip())]
    if file_path:
        return _extract_file(file_path)
    if source_url:
        return _extract_url(source_url)
    raise ValueError("One of raw_content, file_path, or source_url must be provided")


def _extract_file(file_path: str) -> list[PageText]:
    path = Path(file_path)
    if not path.exists():
        raise ValueError(f"File not found: {file_path}")
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return _extract_pdf(str(path))
    if suffix == ".docx":
        return _extract_docx(str(path))
    if suffix in (".txt", ".md"):
        text = path.read_text(encoding="utf-8")
        return [PageText(page_number=None, text=text.strip())]
    raise ValueError(f"Unsupported file type: {suffix}")


def _extract_pdf(file_path: str) -> list[PageText]:
    """Mỗi trang PDF → 1 PageText riêng để chunk_service giữ đúng số trang cho citation."""
    from pypdf import PdfReader
    reader = PdfReader(file_path)
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append(PageText(page_number=i, text=text))
    return pages


def _extract_docx(file_path: str) -> list[PageText]:
    from docx import Document
    doc = Document(file_path)
    text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return [PageText(page_number=None, text=text.strip())]


def _extract_url(url: str) -> list[PageText]:
    """Download bytes từ URL, sniff Content-Type/file extension, extract tương ứng.
    Hỗ trợ: PDF, DOCX, TXT, MD (text), HTML.
    """
    import httpx
    import io

    response = httpx.get(url, follow_redirects=True, timeout=60)
    response.raise_for_status()

    content_type = (response.headers.get("content-type") or "").lower()
    url_lower = url.lower()

    # Detect PDF từ content-type hoặc đuôi URL
    if "application/pdf" in content_type or url_lower.endswith(".pdf"):
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name
        try:
            return _extract_pdf(tmp_path)
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    # Detect DOCX
    if ("application/vnd.openxmlformats-officedocument" in content_type
            or url_lower.endswith(".docx")):
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name
        try:
            return _extract_docx(tmp_path)
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    # Detect plain text (TXT, MD)
    if ("text/plain" in content_type or url_lower.endswith(".txt")
            or url_lower.endswith(".md")):
        text = response.text.strip()
        return [PageText(page_number=None, text=text)]

    # Fallback: parse HTML
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(response.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    return [PageText(page_number=None, text=text)]
