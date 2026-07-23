import { render, screen } from "@testing-library/react";
import { test, vi } from "vitest";

const useAdminDashboard = vi.hoisted(() => vi.fn());

vi.mock("@/features/admin/hooks/use-admin-dashboard", () => ({
  useAdminDashboard,
}));

import AdminDashboardPage from "@/features/admin/pages/AdminDashboardPage";

test("renders dashboard statistics supplied by the admin query hook", () => {
  useAdminDashboard.mockReturnValue({
    data: {
      accounts: { active: 10, banned: 1, total: 12, unverified: 1 },
      billing: {
        activeSubscriptions: 3,
        revenueChart: [],
        totalRevenue: 250000,
      },
      documents: { active: 5, pending: 2, rejected: 1, total: 8 },
      subjects: { total: 4 },
    },
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  });

  render(<AdminDashboardPage />);

  expect(screen.getByText("Tổng tài khoản")).toBeInTheDocument();
  expect(screen.getByText("12")).toBeInTheDocument();
  expect(screen.getByText("250.000 ₫")).toBeInTheDocument();
});
