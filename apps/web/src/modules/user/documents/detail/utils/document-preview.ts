"use client";

import type { DocumentDetail } from "@/types/document.type";
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

async function fetchBlob(fileUrl: string): Promise<Blob> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to load file: ${response.status}`);
  }

  return response.blob();
}

async function fetchText(fileUrl: string): Promise<string> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to load text file: ${response.status}`);
  }

  return response.text();
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
): Promise<DocumentPreviewData> {
  const normalizedFormat = normalizeFormat(document.format);

  if (normalizedFormat === "pdf") {
    return { type: "pdf", fileUrl: document.fileUrl };
  }

  if (normalizedFormat === "docx" || normalizedFormat === "doc") {
    return { type: "docx", file: await fetchBlob(document.fileUrl) };
  }

  if (normalizedFormat === "txt") {
    return { type: "txt", textContent: await fetchText(document.fileUrl) };
  }

  if (IMAGE_FORMATS.has(normalizedFormat)) {
    return { type: "image", images: [document.fileUrl] };
  }

  return { type: "unsupported" };
}
