import axios from "axios";
import { APP_CONFIG } from "@/config";
import { apiClient } from "@/lib/axios";
import { normalizeUserRole } from "@/lib/auth";
import { API_ENDPOINTS } from "@/shared/constants";
import type { User } from "@/types";

type ApiEnvelope<T> = {
  success?: boolean;
  statusCode?: number;
  status_code?: number;
  message?: string;
  data?: T;
};

const client = axios.create({
  baseURL: APP_CONFIG.api.baseUrl,
  timeout: APP_CONFIG.api.timeout,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

const isApiEnvelope = <T>(value: unknown): value is ApiEnvelope<T> => {
  return (
    value !== null &&
    typeof value === "object" &&
    ("data" in value ||
      "message" in value ||
      "success" in value ||
      "statusCode" in value ||
      "status_code" in value)
  );
};

const unwrap = <T>(response: unknown): ApiEnvelope<T> => {
  if (response == null) {
    return { data: null as T };
  }

  const data = response as { data?: ApiEnvelope<T> | T };
  const payload = "data" in data ? data.data : response;

  if (payload == null) {
    return { data: null as T };
  }

  return isApiEnvelope<T>(payload) ? payload : { data: payload as T };
};

type AuthDeviceType = "WEB" | "MOBILE";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

export const signup = async (payload: {
  name: string;
  email: string;
  password: string;
}) => {
  try {
    return unwrap<null>(await client.post("/api/v1/auth/signup", payload));
  } catch (error) {
    throw new Error(getErrorMessage(error, "Registration failed"));
  }
};

export const signin = async (payload: {
  email: string;
  password: string;
  deviceId: string;
}) => {
  try {
    return unwrap<{ accessToken?: string }>(
      await client.post("/api/v1/auth/signin", payload),
    );
  } catch (error) {
    throw new Error(getErrorMessage(error, "Login failed"));
  }
};

export const verifyEmail = async (payload: {
  token: string;
  deviceId?: string;
  deviceType?: AuthDeviceType;
}) => {
  try {
    return unwrap<{ accessToken?: string } | null>(
      await client.post("/api/v1/auth/verify-email", payload),
    );
  } catch (error) {
    throw new Error(getErrorMessage(error, "Email verification failed"));
  }
};

export const resendVerificationEmail = async () => {
  try {
    return unwrap<null>(
      await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION_EMAIL),
    );
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Could not resend verification email"),
    );
  }
};

export const forgotPassword = async (payload: { email: string }) => {
  try {
    return unwrap<null>(
      await client.post("/api/v1/auth/forgot-password", payload),
    );
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Could not send password reset link"),
    );
  }
};

export const resetPassword = async (payload: {
  token: string;
  password: string;
}) => {
  try {
    return unwrap<null>(
      await client.post("/api/v1/auth/reset-password", payload),
    );
  } catch (error) {
    throw new Error(getErrorMessage(error, "Could not reset password"));
  }
};

export const logoutCurrentSession = async (): Promise<void> => {
  try {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, null, {
      skipToast: true,
    });
  } catch {
    // Logout must still clear client auth when the server session is already
    // expired, missing, or otherwise cannot be revoked.
  }
};

export const changePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}) => {
  try {
    return unwrap<null>(
      await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload),
    );
  } catch (error) {
    throw new Error(getErrorMessage(error, "Could not change password"));
  }
};

type CurrentUserResponse = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  status: string;
  createdAt: string;
};

export const mapCurrentUser = (account: CurrentUserResponse): User => ({
  id: account.id,
  email: account.email,
  name: account.name,
  role: normalizeUserRole(account.role),
  status: account.status,
  avatar: account.avatarUrl || undefined,
  createdAt: new Date(account.createdAt),
});

export const getCurrentUser = async (): Promise<User> => {
  try {
    const account = await apiClient.get<unknown, CurrentUserResponse>(
      API_ENDPOINTS.AUTH.ME,
      { skipToast: true },
    );
    return mapCurrentUser(account);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Could not fetch current user"));
  }
};
