import axios from "axios";
import { APP_CONFIG } from "@/config";
import { API_ENDPOINTS } from "@/shared/constants";
import { useAuthStore } from "@/stores/auth/store";
import { toast } from "sonner";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipToast?: boolean;
    _retry?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: APP_CONFIG.api.baseUrl,
  timeout: APP_CONFIG.api.timeout,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

const isAuthPage = (pathname: string): boolean =>
  pathname === "/login" ||
  pathname === "/register" ||
  pathname === "/forgot-password" ||
  pathname.startsWith("/reset-password") ||
  pathname.startsWith("/verify-email/");

const PUBLIC_AUTH_ENDPOINTS = [
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.REGISTER,
  API_ENDPOINTS.AUTH.VERIFY_EMAIL,
  API_ENDPOINTS.AUTH.REFRESH,
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
] as const;

const isPublicAuthEndpoint = (url?: string): boolean =>
  Boolean(
    url && PUBLIC_AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint)),
  );

export const getLoginRedirectHref = (pathname: string, search = ""): string => {
  if (!pathname || pathname === "/" || isAuthPage(pathname)) {
    return "/login";
  }

  return `/login?redirect=${encodeURIComponent(`${pathname}${search}`)}`;
};

const handleLogoutAndRedirectToLogin = () => {
  const store = useAuthStore.getState();
  store.logout();

  if (typeof window === "undefined") {
    return;
  }

  window.location.replace(
    getLoginRedirectHref(window.location.pathname, window.location.search),
  );
};

let refreshTokenPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshTokenPromise) {
    refreshTokenPromise = apiClient
      .post(API_ENDPOINTS.AUTH.REFRESH, null, { skipToast: true })
      .then((response) => {
        const data = response as unknown as { accessToken?: unknown };

        if (!data || typeof data.accessToken !== "string") return null;

        return data.accessToken;
      })
      .finally(() => {
        refreshTokenPromise = null;
      });
  }

  return refreshTokenPromise;
};

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  const isPublicAuthRequest = isPublicAuthEndpoint(config.url);

  if (token && !isPublicAuthRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    return response.data?.data !== undefined
      ? response.data.data
      : response.data;
  },
  async (error) => {
    const originalRequest = error.config ?? {};
    const is401 = error.response?.status === 401;
    const isPublicAuthRequest = isPublicAuthEndpoint(originalRequest.url);

    if (axios.isCancel(error)) return Promise.reject(error);

    // 401 từ auth endpoint (login sai, v.v.) → để page tự hiện lỗi form
    if (is401 && isPublicAuthRequest) {
      return Promise.reject(error);
    }

    // 401 từ request thường → thử refresh token trước
    if (is401 && !isPublicAuthRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken();

        if (!accessToken) throw new Error("Failed to refresh access token.");

        useAuthStore.getState().setAccessToken(accessToken);
        return apiClient(originalRequest);
      } catch {
        handleLogoutAndRedirectToLogin();
        return Promise.reject(error);
      }
    }

    if (is401 && !isPublicAuthRequest) {
      handleLogoutAndRedirectToLogin();
    }

    if (originalRequest.skipToast) return Promise.reject(error);

    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred. Please try again.";

    toast.error(message);

    return Promise.reject(error);
  },
);
