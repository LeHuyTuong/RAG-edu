import { render, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
const authSession = vi.hoisted(() => ({
  isAuthenticated: true,
  isLoadingUser: false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => authSession,
}));

import { GuestRoute } from "@/routes/GuestRoute";

beforeEach(() => {
  navigation.replace.mockReset();
});

test("redirects an authenticated user away from a guest-only route", async () => {
  const { queryByText } = render(
    <GuestRoute>
      <p>Guest content</p>
    </GuestRoute>,
  );

  expect(queryByText("Guest content")).not.toBeInTheDocument();
  await waitFor(() => {
    expect(navigation.replace).toHaveBeenCalledWith("/home");
  });
});
