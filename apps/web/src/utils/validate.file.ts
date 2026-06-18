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

  // validate extension
  const extension = file.name.includes(".")
    ? `.${file.name.split(".").pop()?.toLowerCase()}`
    : "";
  const normalizedAllowedExtensions = config.allowedExtensions.map((ext) =>
    ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`,
  );

  const validExtension = normalizedAllowedExtensions.includes(extension);

  if (!validMime || !validExtension) {
    return {
      valid: false,
      error: "Unsupported file type",
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
