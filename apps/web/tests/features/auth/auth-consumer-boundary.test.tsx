import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: {
      id: "1",
      email: "student@example.com",
      name: "Nguyễn An",
      role: "student",
      createdAt: new Date("2026-07-01T00:00:00Z"),
    },
  }),
}));

import { UserInfo } from "@/components/ui/UserInfo";

test("reads account display data through the auth feature hook", () => {
  render(<UserInfo />);

  expect(screen.getByText("Nguyễn An")).toBeInTheDocument();
  expect(screen.getByText("student@example.com")).toBeInTheDocument();
});
