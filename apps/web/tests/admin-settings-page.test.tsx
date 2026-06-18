import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminSystemSettingsPage from "../src/modules/admin/pages/AdminSystemSettingsPage";

// ── Hoisted mock state ────────────────────────────────────────────────────────

const themeMock = vi.hoisted(() => ({ toggle: vi.fn() }));
const languageMock = vi.hoisted(() => ({ changeLanguage: vi.fn() }));
const settingsApiMock = vi.hoisted(() => ({ deleteAccount: vi.fn() }));
const authStoreMock = vi.hoisted(() => ({
  user: {
    id: "usr-1",
    email: "test@example.com",
    name: "Test User",
    role: "student" as const,
    createdAt: new Date(),
  },
  logout: vi.fn(),
}));

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("../src/hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light", isDark: false, toggle: themeMock.toggle }),
}));

vi.mock("../src/hooks/useLanguage", () => ({
  useLanguage: () => ({
    language: "vi",
    languageLabel: "Tiếng Việt",
    changeLanguage: languageMock.changeLanguage,
  }),
}));

vi.mock("../src/modules/settings/api", () => settingsApiMock);

vi.mock("../src/stores/auth/store", () => ({
  useAuthStore: (selector: (state: typeof authStoreMock) => unknown) =>
    selector(authStoreMock),
}));

// ─────────────────────────────────────────────────────────────────────────────

describe("AdminSystemSettingsPage (single-page settings)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsApiMock.deleteAccount.mockResolvedValue(undefined);
  });

  // ── Rendering ───────────────────────────────────────────────────────────────

  it("renders both sections on the same page without nav tabs", () => {
    render(<AdminSystemSettingsPage />);

    expect(screen.getByText("Cài đặt")).toBeInTheDocument();
    // All sections visible simultaneously — no tab clicks needed
    expect(screen.getByText("Tiếng Việt")).toBeInTheDocument();
    expect(screen.getByText("Vùng nguy hiểm")).toBeInTheDocument();
  });

  it("does not render any sidebar navigation", () => {
    render(<AdminSystemSettingsPage />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("no longer contains old system-settings controls", () => {
    render(<AdminSystemSettingsPage />);

    expect(
      screen.queryByRole("button", { name: "Lưu thay đổi" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Cấu hình hệ thống chưa có API lưu thay đổi."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Cấu hình chung")).not.toBeInTheDocument();
  });

  // ── Language selection ──────────────────────────────────────────────────────

  it("calls changeLanguage with 'en' when the English option is clicked", () => {
    render(<AdminSystemSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: /english/i }));

    expect(languageMock.changeLanguage).toHaveBeenCalledWith("en");
  });

  it("calls changeLanguage with 'vi' when the Vietnamese option is clicked", () => {
    render(<AdminSystemSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: /tiếng việt/i }));

    expect(languageMock.changeLanguage).toHaveBeenCalledWith("vi");
  });

  // ── Delete account flow ─────────────────────────────────────────────────────

  it("opens a confirmation modal when the delete account button is clicked", () => {
    render(<AdminSystemSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Xóa tài khoản" }));

    expect(screen.getByText("Xóa tài khoản?")).toBeInTheDocument();
    expect(screen.getByText(/sẽ bị xóa vĩnh viễn/i)).toBeInTheDocument();
  });

  it("closes the modal without calling the API when cancel is clicked", () => {
    render(<AdminSystemSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Xóa tài khoản" }));
    expect(screen.getByText("Xóa tài khoản?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));

    expect(screen.queryByText("Xóa tài khoản?")).not.toBeInTheDocument();
    expect(settingsApiMock.deleteAccount).not.toHaveBeenCalled();
  });

  it("calls deleteAccount with the user id and then logs out when confirmed", async () => {
    const { router } = (
      globalThis as typeof globalThis & {
        navigationMocks: { router: { replace: ReturnType<typeof vi.fn> } };
      }
    ).navigationMocks;

    render(<AdminSystemSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Xóa tài khoản" }));

    // Modal confirm button is the last "Xóa tài khoản" in the DOM
    const allDeleteBtns = screen.getAllByRole("button", {
      name: "Xóa tài khoản",
    });
    fireEvent.click(allDeleteBtns[allDeleteBtns.length - 1]!);

    await waitFor(() => {
      expect(settingsApiMock.deleteAccount).toHaveBeenCalledWith("usr-1");
    });

    expect(authStoreMock.logout).toHaveBeenCalledOnce();
    expect(router.replace).toHaveBeenCalledWith("/login");
  });

  it("shows an inline error in the danger zone if deleteAccount fails", async () => {
    settingsApiMock.deleteAccount.mockRejectedValue(
      new Error("Máy chủ không phản hồi"),
    );

    render(<AdminSystemSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Xóa tài khoản" }));

    const allDeleteBtns = screen.getAllByRole("button", {
      name: "Xóa tài khoản",
    });
    fireEvent.click(allDeleteBtns[allDeleteBtns.length - 1]!);

    await waitFor(() => {
      expect(screen.getByText("Máy chủ không phản hồi")).toBeInTheDocument();
    });

    expect(authStoreMock.logout).not.toHaveBeenCalled();
  });
});
