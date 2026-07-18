"use client";

import type { DocumentDetail } from "@/types/document.type";
import { APP_CONFIG } from "@/config";
import { buildProtectedFileUrl } from "./document-download";
import type { DocumentPreviewData } from "../type";

const IMAGE_FORMATS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "svg",
]);

async function fetchProtectedBlob(
  documentId: number | string,
  accessToken: string,
): Promise<Blob> {
  const response = await fetch(
    `${APP_CONFIG.api.baseUrl}${buildProtectedFileUrl(documentId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to load file: ${response.status}`);
  }

  return response.blob();
}

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
  accessToken: string,
): Promise<DocumentPreviewData> {
  const normalizedFormat = normalizeFormat(document.format);
  const file = await fetchProtectedBlob(document.id, accessToken);
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
