/**
 * Types aligned with the backend documents & subjects modules.
 * List endpoint (GET /api/v1/documents) returns LibraryDocument[].
 * Detail endpoint (GET /api/v1/documents/:id) returns DocumentDetail.
 */

export type DocumentStatus = "ACTIVE" | "PENDING" | "REJECTED" | "DELETED";

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
  /** Cloudinary public ID — usable for thumbnail generation */
  publicId: string;
  status: DocumentStatus;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  rejectionDetail?: string | null;
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
  fileUrl: string;
  publicId: string;
  sizeInBytes: number;
  format: string;
  resourceType: string;
  subjectId?: string;
  isPublic: boolean;
}

export interface UpdateDocumentPayload {
  title?: string;
  description?: string;
  subjectId?: string;
  isPublic?: boolean;
}

export interface RejectDocumentPayload {
  rejectionReason: string;
}

export interface ListDocumentsQuery {
  page?: number;
  limit?: number;
  subjectId?: string;
  authorId?: string;
  status?: DocumentStatus;
}

/**
 * Full document returned by GET /api/v1/documents/:id (findOne).
 * Includes fields not present in the list endpoint (description, fileUrl, format, sizeInBytes).
 */
export interface DocumentDetail {
  id: string;
  title: string;
  description: string | null;
  /** Direct Cloudinary URL — used for download and PDF preview */
  fileUrl: string;
  publicId: string;
  /** File extension as stored by Cloudinary, e.g. "pdf", "docx" */
  format: string;
  sizeInBytes: number;
  createdAt: string;
  status?: DocumentStatus;
  isPublic?: boolean;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  rejectionDetail?: string | null;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  subject: DocumentSubject | null;
}
