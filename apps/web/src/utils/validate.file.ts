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
  const extension = file.name.includes(".")
    ? `.${file.name.split(".").pop()?.toLowerCase()}`
    : "";

  const validMime = config.allowedMimeTypes.includes(file.type);
  const validExtension = config.allowedExtensions
    .map((allowedExtension) => allowedExtension.toLowerCase())
    .includes(extension);

  if (!validMime && !validExtension) {
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
