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
