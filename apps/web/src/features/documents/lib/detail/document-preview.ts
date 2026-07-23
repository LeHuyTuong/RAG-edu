import type { DocumentDetail } from "@/types/document.type";
import type { DocumentPreviewData } from "../../types";

const IMAGE_FORMATS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "svg",
]);

function normalizeFormat(format: string): string {
  return format.trim().toLowerCase();
}

export function buildPreviewSkeleton(
  format: string,
  fileUrl: string,
): DocumentPreviewData {
  const normalizedFormat = normalizeFormat(format);

  if (normalizedFormat === "pdf") {
    return { type: "pdf", fileUrl };
  }

  if (normalizedFormat === "docx" || normalizedFormat === "doc") {
    return { type: "docx" };
  }

  if (normalizedFormat === "txt") {
    return { type: "txt" };
  }

  if (IMAGE_FORMATS.has(normalizedFormat)) {
    return { type: "image", images: [fileUrl] };
  }

  return { type: "unsupported" };
}

export async function loadDocumentPreview(
  document: DocumentDetail,
  file: Blob,
): Promise<DocumentPreviewData> {
  const normalizedFormat = normalizeFormat(document.format);
  const objectUrl = URL.createObjectURL(file);

  if (normalizedFormat === "pdf") {
    return { type: "pdf", fileUrl: objectUrl, objectUrl };
  }

  if (normalizedFormat === "docx" || normalizedFormat === "doc") {
    return { type: "docx", file, objectUrl };
  }

  if (normalizedFormat === "txt") {
    let textContent = await file.text();
    if (textContent.length > 50000) {
      textContent =
        textContent.slice(0, 50000) +
        "\n\n... (Nội dung hiển thị được cắt ngắn vì file quá lớn)";
    }
    return { type: "txt", textContent, objectUrl };
  }

  if (IMAGE_FORMATS.has(normalizedFormat)) {
    return { type: "image", images: [objectUrl], objectUrl };
  }

  URL.revokeObjectURL(objectUrl);
  return { type: "unsupported" };
}
