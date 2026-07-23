import { apiClient } from "@/shared/api/api-client";
import { API_ENDPOINTS } from "@/shared/constants";
import { DEFAULT_UPLOAD_CONFIG } from "@/constants/upload.const";
import type { UploadConfig } from "@/types/upload";

interface ServerUploadConfig {
  maxFileSize: number;
  allowedTypes: string;
}

export interface UploadedFile {
  fileUrl: string;
  publicId: string;
  sizeInBytes: number;
  format: string;
  resourceType: string;
}

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export async function fetchUploadConfig(): Promise<UploadConfig> {
  const result = await apiClient.get(API_ENDPOINTS.UPLOAD.CONFIG);
  const server = result as unknown as ServerUploadConfig;
  const allowedExtensions = server.allowedTypes
    .split(",")
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean)
    .map((type) => (type.startsWith(".") ? type : `.${type}`));
  const allowedMimeTypes = allowedExtensions
    .map((extension) => MIME_TYPES[extension.slice(1)])
    .filter((type): type is string => Boolean(type));

  return {
    maxFileSize: server.maxFileSize,
    maxFiles: DEFAULT_UPLOAD_CONFIG.maxFiles,
    allowedExtensions,
    allowedMimeTypes,
  };
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const body = new FormData();
  body.append("file", file);

  const result = await apiClient.post(API_ENDPOINTS.UPLOAD.BASE, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return result as unknown as UploadedFile;
}
