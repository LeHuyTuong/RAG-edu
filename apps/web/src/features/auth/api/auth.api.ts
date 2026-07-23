import { apiClient } from "@/shared/api/api-client";
import { API_ENDPOINTS } from "@/shared/constants";

import { mapCurrentAccount } from "../lib/auth.mapper";
import type {
  CurrentAccount,
  SignInPayload,
  SignInResponse,
  SignUpPayload,
  User,
} from "../types";

export async function signIn(payload: SignInPayload): Promise<SignInResponse> {
  const result = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, payload, {
    skipToast: true,
  });

  return result as unknown as SignInResponse;
}

export async function signUp(payload: SignUpPayload): Promise<void> {
  await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, payload, {
    skipToast: true,
  });
}

export async function fetchCurrentUser(): Promise<User> {
  const account = (await apiClient.get(API_ENDPOINTS.AUTH.ME, {
    skipToast: true,
  })) as CurrentAccount;

  return mapCurrentAccount(account);
}

export async function signOut(): Promise<void> {
  try {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, null, {
      skipToast: true,
    });
  } catch {
    // Clear the local session even if the server-side session has already expired.
  }
}
