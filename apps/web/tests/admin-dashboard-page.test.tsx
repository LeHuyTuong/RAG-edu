import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminDashboardPage from "../src/modules/admin/pages/AdminDashboardPage";

const adminApiMock = vi.hoisted(() => ({
  fetchAdminDashboardStats: vi.fn(),
}));

vi.mock("../src/modules/admin/api", () => adminApiMock);

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApiMock.fetchAdminDashboardStats.mockResolvedValue({
      accounts: { total: 12, active: 7, banned: 2, unverified: 3 },
      subjects: { total: 5 },
      documents: { total: 20, active: 14, pending: 4, rejected: 2 },
    });
  });

  it("renders dashboard summary cards from the admin dashboard API", async () => {
    render(<AdminDashboardPage />);

    expect(
      screen.getByText("Đang tải số liệu dashboard..."),
    ).toBeInTheDocument();

    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByText("12,840")).not.toBeInTheDocument();

    expect(adminApiMock.fetchAdminDashboardStats).toHaveBeenCalledWith();
  });

  it("shows an error state when dashboard stats cannot be loaded", async () => {
    adminApiMock.fetchAdminDashboardStats.mockRejectedValue(
      new Error("Network failed"),
    );

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Không thể tải số liệu dashboard."),
      ).toBeInTheDocument();
    });
  });
});
