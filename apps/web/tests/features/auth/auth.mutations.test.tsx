import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const authApi = vi.hoisted(() => ({
  fetchCurrentUser: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/features/auth/api/auth.api", () => authApi);

import { authKeys } from "@/features/auth/auth.keys";
import { useLogin, useLogout } from "@/features/auth/hooks/use-auth-mutations";
import { useAuthStore } from "@/features/auth/store/auth.store";

const student = {
  id: "1",
  email: "student@example.com",
  name: "Student",
  role: "student" as const,
  createdAt: new Date("2026-07-01T00:00:00Z"),
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    queryClient,
    Wrapper({ children }: { readonly children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    },
  };
}

beforeEach(() => {
  useAuthStore.getState().clearSession();
  vi.clearAllMocks();
  authApi.signIn.mockResolvedValue({ accessToken: "access-token" });
  authApi.fetchCurrentUser.mockResolvedValue(student);
  authApi.signOut.mockResolvedValue(undefined);
});

test("stores the access token and caches the current user after login", async () => {
  const { Wrapper, queryClient } = createWrapper();
  const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });

  let loggedInUser: unknown;

  await act(async () => {
    loggedInUser = await result.current.mutateAsync({
      email: "student@example.com",
      password: "secret123",
    });
  });

  expect(useAuthStore.getState().accessToken).toBe("access-token");
  expect(loggedInUser).toMatchObject({ id: "1", role: "student" });
  expect(queryClient.getQueryData(authKeys.me())).toMatchObject({ id: "1" });
  await waitFor(() => {
    expect(result.current.data).toMatchObject({ id: "1", role: "student" });
  });
});

test("clears local session state after logout", async () => {
  useAuthStore.getState().setAccessToken("access-token");
  const { Wrapper } = createWrapper();
  const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });

  await act(async () => {
    await result.current.mutateAsync();
  });

  expect(useAuthStore.getState().accessToken).toBeNull();
});
