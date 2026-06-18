import axios, { type AxiosAdapter } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient, getLoginRedirectHref } from "../src/lib/axios";
import { canAccessRoute, getAuthRedirect } from "../src/routes";
import { API_ENDPOINTS } from "../src/shared/constants";
import { useAuthStore } from "../src/stores/auth/store";

const makeUser = () => ({
  id: "user-1",
  email: "student@example.com",
  name: "Nguyen Student",
  role: "USER",
  status: "ACTIVE",
  createdAt: "2026-06-12T00:00:00.000Z",
});

describe("auth redirect helpers", () => {
  it("builds login redirect URLs for protected pages", () => {
    expect(getLoginRedirectHref("/profile", "?tab=info")).toBe(
      "/login?redirect=%2Fprofile%3Ftab%3Dinfo",
    );
    expect(getLoginRedirectHref("/uploads")).toBe("/login?redirect=%2Fuploads");
  });

  it("does not add redirect params for public auth pages or root", () => {
    expect(getLoginRedirectHref("/")).toBe("/login");
    expect(getLoginRedirectHref("/login")).toBe("/login");
    expect(getLoginRedirectHref("/register")).toBe("/login");
    expect(getLoginRedirectHref("/reset-password/token")).toBe("/login");
    expect(getLoginRedirectHref("/verify-email/token")).toBe("/login");
  });

  it("allows authenticated users to stay on verify-email routes", () => {
    expect(
      canAccessRoute({
        pathname: "/verify-email/token",
        isAuthenticated: true,
      }),
    ).toBe(true);
    expect(getAuthRedirect("/verify-email/token", true)).toBeNull();
  });
});

describe("web api auth interceptors", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
    vi.clearAllMocks();
  });

  it("refreshes with the refresh-token cookie and retries skipToast session requests", async () => {
    useAuthStore
      .getState()
      .setAuth("expired-access-token", "student", undefined, null);

    const adapter = vi.fn<ReturnType<AxiosAdapter>, Parameters<AxiosAdapter>>(
      async (config) => {
        if (config.url === API_ENDPOINTS.AUTH.REFRESH) {
          expect(config.data).toBe("null");

          return {
            data: {
              success: true,
              status_code: 200,
              message: "Token refreshed successfully",
              data: { accessToken: "new-access-token" },
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
          };
        }

        if (
          config.url === API_ENDPOINTS.AUTH.ME &&
          config.headers?.Authorization !== "Bearer new-access-token"
        ) {
          throw new axios.AxiosError(
            "Expired access token",
            "ERR_BAD_REQUEST",
            config,
            undefined,
            {
              data: {
                success: false,
                status_code: 401,
                message: "Unauthorized",
                data: null,
              },
              status: 401,
              statusText: "Unauthorized",
              headers: {},
              config,
            },
          );
        }

        return {
          data: {
            success: true,
            status_code: 200,
            message: "Current user retrieved successfully",
            data: makeUser(),
          },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      },
    );

    const previousAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = adapter;

    try {
      await expect(
        apiClient.get(API_ENDPOINTS.AUTH.ME, { skipToast: true }),
      ).resolves.toEqual(makeUser());
    } finally {
      apiClient.defaults.adapter = previousAdapter;
    }

    expect(useAuthStore.getState().accessToken).toBe("new-access-token");
    expect(adapter).toHaveBeenCalledTimes(3);
    expect(adapter.mock.calls[2]?.[0].headers?.Authorization).toBe(
      "Bearer new-access-token",
    );
  });

  it("attaches the access token when resending verification email", async () => {
    useAuthStore.getState().setAuth("access-token", "student", undefined, null);

    const adapter = vi.fn<ReturnType<AxiosAdapter>, Parameters<AxiosAdapter>>(
      async (config) => ({
        data: {
          success: true,
          status_code: 200,
          message: "Verification email sent",
          data: null,
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      }),
    );
    const previousAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = adapter;

    try {
      await apiClient.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION_EMAIL);
    } finally {
      apiClient.defaults.adapter = previousAdapter;
    }

    expect(adapter.mock.calls[0][0].headers?.Authorization).toBe(
      "Bearer access-token",
    );
  });
});
