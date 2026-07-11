import { UploadConfig } from "../types/upload";

export interface ValidateFileResult {
  readonly valid: boolean;
  readonly error?: string;
}

export const validateFile = (
  file: File,
  config: UploadConfig,
): ValidateFileResult => {
  // validate mime type
  const validMime = config.allowedMimeTypes.includes(file.type);

  const allowedExts = [".pdf", ".doc", ".docx", ".txt"];

  const extension = file.name.includes(".")
    ? `.${file.name.split(".").pop()?.toLowerCase()}`
    : "";

  const validExtension = allowedExts.includes(extension);

  if (!validMime || !validExtension) {
    return {
      valid: false,
      error: "Chỉ nhận tài liệu!",
    };
  }

  // validate size
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `File exceeds ${config.maxFileSize / 1024 / 1024}MB`,
    };
  }

  return {
    valid: true,
  };
};
