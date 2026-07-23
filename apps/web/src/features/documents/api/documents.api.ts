import { APP_CONFIG } from "@/config";
import { apiClient } from "@/shared/api/api-client";
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

import { normalizeDocumentListQuery } from "../lib/document-query";

export interface ShareLinkResponse {
  shareToken: string;
  shareUrl: string;
}

export interface DocumentFileResponse {
  blob: Blob;
  filename: string | null;
}

export type DocumentFileDisposition = "inline" | "download";

export async function fetchDocuments(
  query: ListDocumentsQuery = {},
): Promise<DocumentsListResponse> {
  const params = normalizeDocumentListQuery(query);
  const result = await apiClient.get(API_ENDPOINTS.DOCUMENTS.BASE, { params });

  return result as unknown as DocumentsListResponse;
}

export async function fetchDocumentDetail(id: string): Promise<DocumentDetail> {
  const result = await apiClient.get(API_ENDPOINTS.DOCUMENTS.DETAIL(id), {
    skipToast: true,
  });

  return result as unknown as DocumentDetail;
}

export async function fetchDocumentFile(
  id: string,
  accessToken: string,
  disposition: DocumentFileDisposition = "inline",
): Promise<DocumentFileResponse> {
  const response = await fetch(
    `${APP_CONFIG.api.baseUrl}${
      disposition === "download"
        ? API_ENDPOINTS.DOCUMENTS.DOWNLOAD(id)
        : API_ENDPOINTS.DOCUMENTS.FILE(id)
    }`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) {
    throw new Error("Không thể tải tài liệu");
  }

  return {
    blob: await response.blob(),
    filename: getResponseFilename(response),
  };
}

export async function fetchMyDocuments(
  query: ListDocumentsQuery = {},
): Promise<DocumentsListResponse> {
  const params = normalizeDocumentListQuery(query);
  const result = await apiClient.get(`${API_ENDPOINTS.DOCUMENTS.BASE}/me`, {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.subjectId ? { subjectId: params.subjectId } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  });

  return result as unknown as DocumentsListResponse;
}

export async function createDocument(
  payload: CreateDocumentPayload,
): Promise<LibraryDocument> {
  const result = await apiClient.post(API_ENDPOINTS.DOCUMENTS.BASE, payload);

  return result as unknown as LibraryDocument;
}

export async function updateDocument(
  id: string,
  payload: UpdateDocumentPayload,
): Promise<DocumentDetail> {
  const result = await apiClient.patch(
    API_ENDPOINTS.DOCUMENTS.DETAIL(id),
    payload,
  );

  return result as unknown as DocumentDetail;
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.DOCUMENTS.DETAIL(id));
}

export async function restoreDocument(id: string): Promise<void> {
  await apiClient.post(API_ENDPOINTS.DOCUMENTS.RESTORE(id));
}

export async function hardDeleteDocument(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.DOCUMENTS.HARD_DELETE(id));
}

export async function approveDocument(id: string): Promise<DocumentDetail> {
  const result = await apiClient.post(API_ENDPOINTS.DOCUMENTS.APPROVE(id));

  return result as unknown as DocumentDetail;
}

export async function reclassifyDocument(id: string): Promise<void> {
  await apiClient.post(API_ENDPOINTS.DOCUMENTS.RECLASSIFY(id));
}

export async function rejectDocument(
  id: string,
  payload: RejectDocumentPayload,
): Promise<DocumentDetail> {
  const result = await apiClient.post(
    API_ENDPOINTS.DOCUMENTS.REJECT(id),
    payload,
  );

  return result as unknown as DocumentDetail;
}

export async function fetchSubjects(
  limit = 100,
): Promise<SubjectsListResponse> {
  const result = await apiClient.get(API_ENDPOINTS.SUBJECTS.BASE, {
    params: { page: 1, limit },
  });

  return result as unknown as SubjectsListResponse;
}

export async function createShareLink(id: string): Promise<ShareLinkResponse> {
  const result = await apiClient.post(API_ENDPOINTS.DOCUMENTS.SHARE(id));

  return result as unknown as ShareLinkResponse;
}

export async function revokeShareLink(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.DOCUMENTS.SHARE(id));
}

export async function fetchSharedDocument(
  token: string,
): Promise<DocumentDetail> {
  const result = await apiClient.get(API_ENDPOINTS.DOCUMENTS.SHARED(token));

  return result as unknown as DocumentDetail;
}

function getResponseFilename(response: Response): string | null {
  const disposition = response.headers.get("content-disposition");
  if (!disposition) return null;

  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);

  return disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
}
