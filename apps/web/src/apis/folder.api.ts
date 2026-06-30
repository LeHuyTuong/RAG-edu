/**
 * Folder API
 * Quản lý thư mục học tập của người dùng.
 * Tất cả endpoints yêu cầu JWT — apiClient tự động gắn token.
 */

import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/shared/constants";

// ─── Types ───

export interface FolderResponse {
  id: number;
  folderName: string;
  ownerId: number;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderPayload {
  folderName: string;
}

export interface RenameFolderPayload {
  folderName: string;
}

export interface FolderChatRequest {
  question: string;
  topK?: number;
  temperature?: number;
}

// ─── CRUD Folders ───

/**
 * POST /api/v1/folders — Tạo một thư mục mới.
 */
export const createFolder = async (
  payload: CreateFolderPayload,
): Promise<FolderResponse> => {
  const result = await apiClient.post(API_ENDPOINTS.FOLDERS.BASE, payload);
  return result as unknown as FolderResponse;
};

/**
 * GET /api/v1/folders — Lấy danh sách thư mục của người dùng.
 */
export const listFolders = async (): Promise<FolderResponse[]> => {
  const result = await apiClient.get(API_ENDPOINTS.FOLDERS.BASE);
  return result as unknown as FolderResponse[];
};

/**
 * PATCH /api/v1/folders/:id — Đổi tên thư mục.
 */
export const renameFolder = async (
  id: string,
  payload: RenameFolderPayload,
): Promise<FolderResponse> => {
  const result = await apiClient.patch(
    API_ENDPOINTS.FOLDERS.DETAIL(id),
    payload,
  );
  return result as unknown as FolderResponse;
};

/**
 * DELETE /api/v1/folders/:id — Xoá thư mục.
 */
export const deleteFolder = async (id: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.FOLDERS.DETAIL(id));
};

/**
 * POST /api/v1/folders/:id/chat — Chat trong context của một thư mục.
 * Lưu ý: Endpoint này trả về RagChatResponse (non-stream).
 * Nếu cần streaming SSE, xem rag.api.ts.
 */
export const chatInFolder = async (
  id: string,
  payload: FolderChatRequest,
): Promise<unknown> => {
  const result = await apiClient.post(API_ENDPOINTS.FOLDERS.CHAT(id), payload);
  return result;
};
