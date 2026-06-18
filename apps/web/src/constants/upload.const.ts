export const DEFAULT_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024,

  maxFiles: 5,

  allowedMimeTypes: [
    "application/pdf",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "text/plain",

    "image/png",

    "image/jpeg",
  ],

  allowedExtensions: [".pdf", ".docx", ".txt", ".png", ".jpg", ".jpeg"],
};

/**
 * User-facing error messages for the document upload flow.
 *
 * IMPORTANT: Never display raw `error.message` from Cloudinary or the
 * backend API directly to the user — those strings can be technical,
 * inconsistent, or leak implementation details. Always map errors to one
 * of these constants. Log the original error with `console.error` for
 * debugging instead.
 */
export const UPLOAD_ERROR_MESSAGES = {
  /** selectedFile is null when the user clicks submit */
  MISSING_FILE: "Vui lòng chọn tệp tài liệu trước.",
  /** title field is empty/whitespace */
  MISSING_TITLE: "Vui lòng nhập tên tài liệu.",
  /** NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not configured */
  MISSING_UPLOAD_CONFIG:
    "Chưa cấu hình tải lên. Vui lòng liên hệ quản trị viên.",
  /** Cloudinary upload request failed (network error or non-2xx response) */
  CLOUDINARY_UPLOAD_FAILED:
    "Tải tệp lên thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.",
  /** POST /api/v1/documents failed after the file was uploaded successfully */
  CREATE_DOCUMENT_FAILED:
    "Không thể lưu thông tin tài liệu. Vui lòng thử lại sau.",
  /** Fallback for any other unexpected error */
  UNKNOWN: "Đã xảy ra lỗi. Vui lòng thử lại.",
} as const;
