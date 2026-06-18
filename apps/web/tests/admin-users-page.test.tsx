import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminUserManagementPage from "../src/modules/admin/pages/AdminUserManagementPage";

const adminApiMock = vi.hoisted(() => ({
  banAdminAccount: vi.fn(),
  createAdminAccount: vi.fn(),
  fetchAdminAccountDetail: vi.fn(),
  fetchAdminAccounts: vi.fn(),
}));

vi.mock("../src/modules/admin/api", () => adminApiMock);

const account = {
  id: "acc-1",
  email: "student@example.com",
  name: "Nguyen Student",
  avatarUrl: "",
  role: "USER" as const,
  status: "ACTIVE" as const,
  createdAt: "2026-06-08T00:00:00.000Z",
  updatedAt: "2026-06-09T00:00:00.000Z",
};

const bannedAccount = {
  ...account,
  id: "acc-2",
  email: "banned@example.com",
  name: "Banned Student",
  status: "BANNED" as const,
};

describe("AdminUserManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApiMock.fetchAdminAccounts.mockResolvedValue([account]);
    adminApiMock.fetchAdminAccountDetail.mockResolvedValue(account);
    adminApiMock.createAdminAccount.mockResolvedValue({
      message: "Account created successfully",
    });
    adminApiMock.banAdminAccount.mockResolvedValue({
      message: "Account banned successfully",
    });
  });

  it("loads and renders fetched accounts", async () => {
    render(<AdminUserManagementPage />);

    expect(
      screen.getByText("Đang tải danh sách người dùng..."),
    ).toBeInTheDocument();
    expect(await screen.findByText("Nguyen Student")).toBeInTheDocument();
    expect(screen.getByText("student@example.com")).toBeInTheDocument();
    expect(screen.queryByText("ID")).not.toBeInTheDocument();
    expect(screen.queryByText("Đăng nhập gần nhất")).not.toBeInTheDocument();
    expect(adminApiMock.fetchAdminAccounts).toHaveBeenCalledWith({
      createdFrom: undefined,
      createdTo: undefined,
    });
  });

  it("shows an empty state when no accounts match", async () => {
    adminApiMock.fetchAdminAccounts.mockResolvedValue([]);

    render(<AdminUserManagementPage />);

    expect(
      await screen.findByText("Không có tài khoản phù hợp."),
    ).toBeInTheDocument();
  });

  it("opens detail by fetching account detail", async () => {
    render(<AdminUserManagementPage />);

    await screen.findByText("Nguyen Student");
    fireEvent.click(screen.getByRole("button", { name: "Xem Nguyen Student" }));

    await waitFor(() => {
      expect(adminApiMock.fetchAdminAccountDetail).toHaveBeenCalledWith(
        "acc-1",
      );
    });
    expect(screen.getAllByText("student@example.com")).toHaveLength(2);
    expect(
      screen.queryByText("acc-1 · student@example.com"),
    ).not.toBeInTheDocument();
  });

  it("creates a moderator account through the admin API", async () => {
    render(<AdminUserManagementPage />);

    await screen.findByText("Nguyen Student");
    fireEvent.click(
      screen.getByRole("button", { name: "Thêm kiểm duyệt viên" }),
    );
    fireEvent.change(screen.getByLabelText("Tên*"), {
      target: { value: "New Moderator" },
    });
    fireEvent.change(screen.getByLabelText("Email*"), {
      target: { value: "moderator@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu*"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Tạo kiểm duyệt viên" }),
    );

    await waitFor(() => {
      expect(adminApiMock.createAdminAccount).toHaveBeenCalledWith({
        name: "New Moderator",
        email: "moderator@example.com",
        password: "Password123!",
        avatarUrl: undefined,
        role: "MODERATOR",
        status: "ACTIVE",
      });
    });
  });

  it("bans an account through confirmation", async () => {
    render(<AdminUserManagementPage />);

    await screen.findByText("Nguyen Student");
    fireEvent.click(
      screen.getByRole("button", { name: "Khóa Nguyen Student" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Khóa" }));

    await waitFor(() => {
      expect(adminApiMock.banAdminAccount).toHaveBeenCalledWith("acc-1");
    });
  });

  it("hides the ban action for banned accounts", async () => {
    adminApiMock.fetchAdminAccounts.mockResolvedValue([bannedAccount]);

    render(<AdminUserManagementPage />);

    expect(await screen.findByText("Banned Student")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Khóa Banned Student" }),
    ).not.toBeInTheDocument();
  });

  it("reloads accounts with created date filters", async () => {
    render(<AdminUserManagementPage />);

    await screen.findByText("Nguyen Student");
    fireEvent.change(screen.getByLabelText("Tạo từ ngày"), {
      target: { value: "2026-06-01" },
    });
    fireEvent.change(screen.getByLabelText("Tạo đến ngày"), {
      target: { value: "2026-06-10" },
    });

    await waitFor(() => {
      expect(adminApiMock.fetchAdminAccounts).toHaveBeenLastCalledWith({
        createdFrom: "2026-06-01",
        createdTo: "2026-06-10",
      });
    });
  });

  it("filters admin accounts defensively from the management list", async () => {
    adminApiMock.fetchAdminAccounts.mockResolvedValue([
      account,
      {
        ...account,
        id: "admin-1",
        email: "admin@example.com",
        name: "Hidden Admin",
        role: "ADMIN" as const,
      },
    ]);

    render(<AdminUserManagementPage />);

    expect(await screen.findByText("Nguyen Student")).toBeInTheDocument();
    expect(screen.queryByText("Hidden Admin")).not.toBeInTheDocument();
  });
});
