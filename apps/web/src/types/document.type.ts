/**
 * Types aligned with the backend documents & subjects modules.
 * List endpoint (GET /api/v1/documents) returns LibraryDocument[].
 * Detail endpoint (GET /api/v1/documents/:id) returns DocumentDetail.
 */

export type DocumentStatus = "ACTIVE" | "PENDING" | "REJECTED" | "DELETED";
export type DocumentRagStatus =
  | "UPLOADING"
  | "REVIEWING"
  | "PENDING_REVIEW"
  | "INDEXING"
  | "REINDEXING"
  | "READY"
  | "FAILED"
  | "REJECTED"
  | "SOFT_DELETED";

export interface DocumentAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface DocumentSubject {
  id: string;
  name: string;
  code: string;
}

/** Shape of each item returned by the list endpoint */
export interface LibraryDocument {
  id: string;
  title: string;
  description?: string | null;
  /** Tác giả gốc của nội dung tài liệu (khác với người tải lên) */
  originalAuthor?: string | null;
  /** Cloudinary public ID — usable for thumbnail generation */
  publicId: string;
  fileUrl: string;
  format: string;
  sizeInBytes: number;
  resourceType?: string;
  ragStatus?: DocumentRagStatus;
  status: DocumentStatus;
  isPublic: boolean;
  pageCount?: number | null;
  chunkCount?: number | null;
  folderId?: number | null;
  ownerId?: number;
  createdAt: string;
  updatedAt: string;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  rejectionDetail?: string | null;
  /** Điểm tin cậy AI trả về khi kiểm duyệt nội dung (0.0 - 1.0) */
  aiConfidence?: number | null;
  /** Mức cảnh báo AI: NONE (đã auto-approve) | WARNING (vàng) | DANGER (đỏ) */
  aiWarningLevel?: "NONE" | "WARNING" | "DANGER" | null;
  aiReviewStatus?: "AUTO_APPROVED" | "PENDING_ADMIN" | "REJECTED_BY_AI" | null;
  author: DocumentAuthor;
  subject: DocumentSubject | null;
}

/** Pagination metadata returned alongside every paginated list */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Shape of the axios-unwrapped response for GET /api/v1/documents */
export interface DocumentsListResponse {
  documents: LibraryDocument[];
  pagination: PaginationMeta;
}

/** Subject entity (GET /api/v1/subjects) */
export interface Subject {
  id: string;
  name: string;
  code: string;
}

/** Shape of the axios-unwrapped response for GET /api/v1/subjects */
export interface SubjectsListResponse {
  subjects: Subject[];
  pagination: PaginationMeta;
}

/**
 * Payload sent to POST /api/v1/documents.
 * fileUrl, publicId, sizeInBytes, format, and resourceType come from
 * Cloudinary after the file is uploaded; the rest come from the form.
 */
export interface CreateDocumentPayload {
  title: string;
  description?: string;
  originalAuthor?: string;
  fileUrl: string;
  publicId: string;
  sizeInBytes: number;
  format: string;
  resourceType: string;
  subjectId?: string;
  isPublic: boolean;
  folderId?: number;
}

export interface UpdateDocumentPayload {
  title?: string;
  description?: string;
  originalAuthor?: string;
  subjectId?: string;
  isPublic?: boolean;
  folderId?: number;
}

export interface RejectDocumentPayload {
  rejectionReason: string;
}

export interface ListDocumentsQuery {
  page?: number;
  limit?: number;
  search?: string;
  folderId?: number;
  subjectId?: string;
  /** Backend accepts legacy aliases (DocumentStatus) or the raw 9-state UML enum (DocumentRagStatus) */
  status?: DocumentStatus | DocumentRagStatus;
  onlyMine?: boolean;
}

/**
 * Full document returned by GET /api/v1/documents/:id (findOne).
 * Includes fields not present in the list endpoint (description, fileUrl, format, sizeInBytes).
 */
export interface DocumentDetail {
  id: string;
  title: string;
  description: string | null;
  /** Tác giả gốc của nội dung tài liệu (khác với người tải lên) */
  originalAuthor?: string | null;
  /** Direct Cloudinary URL — used for download and PDF preview */
  fileUrl: string;
  publicId: string;
  /** File extension as stored by Cloudinary, e.g. "pdf", "docx" */
  format: string;
  resourceType?: string;
  sizeInBytes: number;
  pageCount?: number | null;
  chunkCount?: number | null;
  createdAt: string;
  status?: DocumentStatus;
  ragStatus?: DocumentRagStatus;
  isPublic?: boolean;
  ownerId?: number;
  folderId?: number | null;
  shareToken?: string | null;
  shareEnabled?: boolean;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  rejectionDetail?: string | null;
  aiConfidence?: number | null;
  aiWarningLevel?: string | null;
  aiReviewStatus?: string | null;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  subject: DocumentSubject | null;
}
