import { render, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
const authSession = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoadingUser: false,
  user: null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

vi.mock("@/features/auth/hooks/use-auth", () => ({
  useAuth: () => authSession,
}));

import { ProtectedRoute } from "@/features/auth/guards/ProtectedRoute";

beforeEach(() => {
  navigation.replace.mockReset();
  window.history.pushState({}, "", "/profile");
});

test("redirects unauthenticated visitors without rendering protected children", async () => {
  const { queryByText } = render(
    <ProtectedRoute>
      <p>Protected content</p>
    </ProtectedRoute>,
  );

  expect(queryByText("Protected content")).not.toBeInTheDocument();
  await waitFor(() => {
    expect(navigation.replace).toHaveBeenCalledWith(
      "/login?redirect=%2Fprofile",
    );
  });
});

test("waits for session hydration before redirecting", () => {
  authSession.isLoadingUser = true;

  render(
    <ProtectedRoute>
      <p>Protected content</p>
    </ProtectedRoute>,
  );

  expect(navigation.replace).not.toHaveBeenCalled();
  authSession.isLoadingUser = false;
});
