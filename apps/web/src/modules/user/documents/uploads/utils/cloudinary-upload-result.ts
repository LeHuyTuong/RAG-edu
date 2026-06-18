export interface CloudinaryUploadResponse {
  secure_url?: unknown;
  public_id?: unknown;
  bytes?: unknown;
  format?: unknown;
  resource_type?: unknown;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
  resourceType: string;
}

const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "text/plain": "txt",
};

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function extensionFromPath(path: string | undefined): string | undefined {
  if (!path) {
    return undefined;
  }

  const cleanPath = path.split(/[?#]/, 1)[0] ?? "";
  const match = /\.([a-z0-9]+)$/i.exec(cleanPath);
  return match?.[1]?.toLowerCase();
}

function deriveFormat(response: CloudinaryUploadResponse, file: File): string {
  return (
    readString(response.format)?.toLowerCase() ??
    extensionFromPath(readString(response.public_id)) ??
    extensionFromPath(readString(response.secure_url)) ??
    extensionFromPath(file.name) ??
    MIME_TYPE_TO_EXTENSION[file.type] ??
    "unknown"
  );
}

export function buildCloudinaryUploadResult(
  response: CloudinaryUploadResponse,
  file: File,
): CloudinaryUploadResult {
  return {
    url: readString(response.secure_url) ?? "",
    publicId: readString(response.public_id) ?? "",
    bytes: typeof response.bytes === "number" ? response.bytes : 0,
    format: deriveFormat(response, file),
    resourceType: readString(response.resource_type) ?? "raw",
  };
}
