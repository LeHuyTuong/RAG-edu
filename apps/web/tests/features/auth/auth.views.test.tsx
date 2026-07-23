import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/auth", () => ({
  useLogin: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRegister: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { LoginView } from "@/features/auth/components/LoginView";
import { RegisterView } from "@/features/auth/components/RegisterView";

test("keeps the login form and removes unsupported Google authentication", () => {
  render(<LoginView />);

  expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeInTheDocument();
  expect(screen.queryByText("Đăng nhập bằng Google")).not.toBeInTheDocument();
});

test("keeps the register form and removes unsupported Google registration", () => {
  render(<RegisterView />);

  expect(screen.getByRole("button", { name: "Đăng ký" })).toBeInTheDocument();
  expect(screen.queryByText("Đăng ký bằng Google")).not.toBeInTheDocument();
});
