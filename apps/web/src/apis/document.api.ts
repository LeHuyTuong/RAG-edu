/**
 * Document & Subject API functions.
 * All calls use the configured apiClient (auto-attaches JWT, auto-unwraps data.data).
 * Import these functions into Zustand stores or server actions — never call axios directly.
 */

import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/shared/constants";
import type {
  CreateDocumentPayload,
  DocumentDetail,
  DocumentsListResponse,
  LibraryDocument,
  ListDocumentsQuery,
  RejectDocumentPayload,
  SubjectsListResponse,
  UpdateDocumentPayload,
} from "@/types/document.type";

/**
 * Fetch a paginated list of public documents.
 * Supports optional subjectId / authorId / page / limit filters.
 * The axios interceptor unwraps the response so the return value is
 * { documents, pagination } directly.
 */
export const fetchDocuments = async (
  params: ListDocumentsQuery = {},
): Promise<DocumentsListResponse> => {
  // The apiClient interceptor auto-unwraps response.data.data, so the
  // resolved value is DocumentsListResponse at runtime.
  const result = await apiClient.get(API_ENDPOINTS.DOCUMENTS.BASE, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 12,
      ...(params.subjectId ? { subjectId: params.subjectId } : {}),
      ...(params.authorId ? { authorId: params.authorId } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  });
  // Double-cast required: the interceptor unwraps response.data.data at runtime,
  // but TypeScript's axios types still see AxiosResponse here.
  return result as unknown as DocumentsListResponse;
};

/**
 * Fetch all subjects for the filter sidebar.
 * The subjects endpoint is public — no auth required.
 * Returns { subjects, pagination } after interceptor unwrap.
 */
/**
 * Fetch a single document by ID.
 * The backend guards visibility: public ACTIVE docs are accessible without auth;
 * private or PENDING docs require a valid JWT (apiClient attaches it automatically).
 * Throws on 404 / 403 so the caller can handle not-found vs. forbidden separately.
 */
export const fetchDocumentDetail = async (
  id: string,
): Promise<DocumentDetail> => {
  const result = await apiClient.get(API_ENDPOINTS.DOCUMENTS.DETAIL(id));
  return result as unknown as DocumentDetail;
};

/**
 * Fetch the authenticated user's own documents.
 * Requires a valid JWT — apiClient attaches it automatically.
 * Returns the same paginated shape as fetchDocuments.
 */
export const fetchMyDocuments = async (
  params: ListDocumentsQuery = {},
): Promise<DocumentsListResponse> => {
  const result = await apiClient.get(`${API_ENDPOINTS.DOCUMENTS.BASE}/me`, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      ...(params.subjectId ? { subjectId: params.subjectId } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  });
  return result as unknown as DocumentsListResponse;
};

/**
 * Create a new document record after uploading the file to Cloudinary.
 * The caller is responsible for the Cloudinary upload step and must
 * pass the resulting fileUrl / publicId / sizeInBytes / format / resourceType.
 */
export const createDocument = async (
  payload: CreateDocumentPayload,
): Promise<LibraryDocument> => {
  const result = await apiClient.post(API_ENDPOINTS.DOCUMENTS.BASE, payload);
  return result as unknown as LibraryDocument;
};

/**
 * Soft-delete a document (sets status to DELETED).
 * Only the document's author can call this — the backend enforces it.
 */
export const deleteDocument = async (id: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.DOCUMENTS.DETAIL(id));
};

export const updateDocument = async (
  id: string,
  payload: UpdateDocumentPayload,
): Promise<DocumentDetail> => {
  const result = await apiClient.patch(
    API_ENDPOINTS.DOCUMENTS.DETAIL(id),
    payload,
  );
  return result as unknown as DocumentDetail;
};

export const approveDocument = async (id: string): Promise<DocumentDetail> => {
  const result = await apiClient.post(API_ENDPOINTS.DOCUMENTS.APPROVE(id));
  return result as unknown as DocumentDetail;
};

export const rejectDocument = async (
  id: string,
  payload: RejectDocumentPayload,
): Promise<DocumentDetail> => {
  const result = await apiClient.post(
    API_ENDPOINTS.DOCUMENTS.REJECT(id),
    payload,
  );
  return result as unknown as DocumentDetail;
};

export const fetchSubjects = async (
  limit = 100,
): Promise<SubjectsListResponse> => {
  const result = await apiClient.get(API_ENDPOINTS.SUBJECTS.BASE, {
    params: { page: 1, limit },
  });
  return result as unknown as SubjectsListResponse;
};
