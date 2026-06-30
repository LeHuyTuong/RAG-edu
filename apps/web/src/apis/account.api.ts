/**
 * Account API — profile management.
 * All calls use apiClient (auto-attaches JWT, auto-unwraps response.data.data).
 */

import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/shared/constants";

export interface UpdateProfilePayload {
  /** Display name — the only mutable text field the current backend supports. */
  name?: string;
  /**
   * Cloudinary URL for the avatar image.
   * Kept optional: the frontend does not have a dedicated avatar-upload
   * endpoint yet, so this is only set when a Cloudinary URL is available.
   */
  avatarUrl?: string;
}

export interface UpdateProfileResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

/**
 * PATCH /api/v1/accounts/:id
 * Updates the authenticated user's display name and/or avatar URL.
 * The backend enforces that the caller can only update their own account.
 */
export const updateProfile = async (
  userId: string,
  payload: UpdateProfilePayload,
): Promise<UpdateProfileResponse> => {
  const result = await apiClient.patch(
    API_ENDPOINTS.ACCOUNTS.DETAIL(userId),
    payload,
  );
  return result as unknown as UpdateProfileResponse;
};

// ─── Admin: Account Management ───

import type { AdminAccountStatus } from "@/modules/admin/api";

export interface AccountsListResponse {
  accounts: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: AdminAccountStatus;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AccountDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  status: AdminAccountStatus;
  bannedAt: string | null;
  banReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/v1/accounts — Fetch a paginated list of accounts.
 * Yêu cầu role ADMIN — backend enforce.
 */
export const fetchAccounts = async (
  params: { page?: number; limit?: number } = {},
): Promise<AccountsListResponse> => {
  const result = await apiClient.get(API_ENDPOINTS.ACCOUNTS.BASE, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });
  return result as unknown as AccountsListResponse;
};

/**
 * GET /api/v1/accounts/:id — Fetch details of a specific account.
 * Yêu cầu role ADMIN.
 */
export const fetchAccountById = async (id: string): Promise<AccountDetail> => {
  const result = await apiClient.get(API_ENDPOINTS.ACCOUNTS.DETAIL(id));
  return result as unknown as AccountDetail;
};

/**
 * PATCH /api/v1/accounts/:id/ban — Ban or unban an account.
 * Yêu cầu role ADMIN.
 * @param id - Account ID to ban/unban
 * @param reason - Optional reason for the ban
 */
export const banAccount = async (
  id: string,
  reason?: string,
): Promise<AccountDetail> => {
  const result = await apiClient.patch(
    API_ENDPOINTS.ACCOUNTS.BAN(id),
    reason ? { reason } : {},
  );
  return result as unknown as AccountDetail;
};
