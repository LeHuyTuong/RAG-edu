import { useAuthStore } from "@/features/auth/store/auth.store";

beforeEach(() => {
  useAuthStore.getState().clearSession();
});

test("stores an access token and derives an authenticated session", () => {
  useAuthStore.getState().setAccessToken("access-token");

  expect(useAuthStore.getState()).toMatchObject({
    accessToken: "access-token",
    isAuthenticated: true,
  });
});

test("clears persisted and legacy auth keys on logout", () => {
  localStorage.setItem("auth_token", "legacy-token");
  localStorage.setItem("user_info", "legacy-user");
  useAuthStore.getState().setAccessToken("access-token");

  useAuthStore.getState().clearSession();

  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
  expect(localStorage.getItem("auth_token")).toBeNull();
  expect(localStorage.getItem("user_info")).toBeNull();
});
