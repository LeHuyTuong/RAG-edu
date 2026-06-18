import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ForgotPasswordPage from "../src/modules/forgot-password/page";
import ResetPasswordPage from "../src/modules/reset-password/page";
import LoginPage from "../src/app/(auth)/login/page";
import RegisterPage from "../src/app/(auth)/register/page";
import { UserShell } from "../src/modules/user/components/UserShell";
import { useAuthStore } from "../src/stores/auth/store";
import VerifyEmailPage from "../src/app/(auth)/verify-email/[token]/page";
import { navigationMocks } from "./setup";

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

const authApiMocks = vi.hoisted(() => ({
  verifyEmail: vi.fn(),
}));

vi.mock("@/lib/axios", () => ({
  apiClient: apiClientMock,
}));

vi.mock("../src/modules/auth-api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/modules/auth-api")>();

  return {
    ...actual,
    verifyEmail: authApiMocks.verifyEmail,
  };
});

const makeAccessToken = (role = "USER", status = "ACTIVE") => {
  const payload = Buffer.from(
    JSON.stringify({
      sub: "user-1",
      email: "student@example.com",
      name: "Nguyen Student",
      role,
      status,
      type: "accessToken",
      deviceId: "device-1",
    }),
  ).toString("base64url");

  return `header.${payload}.signature`;
};

describe("web auth routing", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
    vi.clearAllMocks();
    navigationMocks.pathname.mockReturnValue("/");
    navigationMocks.searchParams.mockReturnValue(new URLSearchParams());
    navigationMocks.params.mockReturnValue({});
    apiClientMock.get.mockResolvedValue({
      id: "user-1",
      email: "student@example.com",
      name: "Nguyen Student",
      avatarUrl: "",
      role: "USER",
      status: "ACTIVE",
      createdAt: "2026-06-08T00:00:00.000Z",
    });
    authApiMocks.verifyEmail.mockResolvedValue({
      message: "Email đã được xác thực.",
      data: null,
    });
  });

  it("redirects to /home after successful login by default", async () => {
    apiClientMock.post.mockResolvedValue({ accessToken: makeAccessToken() });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(navigationMocks.router.replace).toHaveBeenCalledWith("/home");
    });
  });

  it("redirects to a safe redirect query after successful login", async () => {
    navigationMocks.searchParams.mockReturnValue(
      new URLSearchParams("redirect=/uploads"),
    );
    apiClientMock.post.mockResolvedValue({ accessToken: makeAccessToken() });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(navigationMocks.router.replace).toHaveBeenCalledWith("/uploads");
    });
  });

  it("redirects admins to /admin after successful login by default", async () => {
    apiClientMock.post.mockResolvedValue({
      accessToken: makeAccessToken("ADMIN"),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(navigationMocks.router.replace).toHaveBeenCalledWith("/admin");
    });
  });

  it("redirects moderators to /moderator after successful login by default", async () => {
    apiClientMock.post.mockResolvedValue({
      accessToken: makeAccessToken("MODERATOR"),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "moderator@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(navigationMocks.router.replace).toHaveBeenCalledWith("/moderator");
    });
  });

  it("submits register without signing in and redirects to login", async () => {
    apiClientMock.post.mockResolvedValue({ data: null });

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText("Họ tên"), {
      target: { value: "Nguyen Student" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu"), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    await waitFor(() => {
      expect(apiClientMock.post).toHaveBeenCalledWith(
        "/api/v1/auth/signup",
        expect.objectContaining({
          name: "Nguyen Student",
          email: "student@example.com",
          password: "Password123!",
          deviceId: expect.any(String),
        }),
      );
      expect(navigationMocks.router.replace).toHaveBeenCalledWith("/login");
    });

    expect(apiClientMock.post.mock.calls[0][1]).not.toHaveProperty(
      "confirmPassword",
    );
    expect(apiClientMock.post).not.toHaveBeenCalledWith(
      "/api/v1/auth/signin",
      expect.anything(),
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("hydrates and displays the current user in the shared sidebar", async () => {
    useAuthStore.getState().setAuth("access-token", "student");

    render(
      <UserShell title="Không gian học tập" subtitle="Quản lý tài liệu">
        <div>Content</div>
      </UserShell>,
    );

    expect(await screen.findByText("Nguyen Student")).toBeInTheDocument();
    expect(apiClientMock.get).toHaveBeenCalledWith("/api/v1/auth/me", {
      skipToast: true,
    });
  });

  it("shows a resend verification banner for unverified users", async () => {
    useAuthStore.getState().setAuth(
      "access-token",
      "student",
      {
        id: "user-1",
        email: "student@example.com",
        name: "Nguyen Student",
        role: "student",
        status: "UNVERIFIED",
        createdAt: new Date("2026-06-08T00:00:00.000Z"),
      },
      null,
    );
    apiClientMock.get.mockResolvedValue({
      id: "user-1",
      email: "student@example.com",
      name: "Nguyen Student",
      avatarUrl: "",
      role: "USER",
      status: "UNVERIFIED",
      createdAt: "2026-06-08T00:00:00.000Z",
    });
    apiClientMock.post.mockResolvedValue({ data: null });

    render(
      <UserShell title="Không gian học tập" subtitle="Quản lý tài liệu">
        <div>Content</div>
      </UserShell>,
    );

    expect(
      screen.getByText(
        "Tài khoản của bạn chưa xác thực email. Vui lòng kiểm tra hộp thư để xác thực.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Gửi lại email xác thực" }),
    );

    await waitFor(() => {
      expect(apiClientMock.post).toHaveBeenCalledWith(
        "/api/v1/auth/resend-verification-email",
      );
    });
  });

  it("logs out from the shared sidebar and redirects to /login", async () => {
    useAuthStore.getState().setAuth(
      null,
      "student",
      {
        id: "user-1",
        email: "student@example.com",
        name: "Nguyen Student",
        role: "student",
        createdAt: new Date("2026-06-08T00:00:00.000Z"),
      },
      null,
    );
    apiClientMock.post.mockResolvedValue({ data: null });

    render(
      <UserShell title="Không gian học tập" subtitle="Quản lý tài liệu">
        <div>Content</div>
      </UserShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Đăng xuất/i }));

    await waitFor(() => {
      expect(apiClientMock.post).toHaveBeenCalledWith(
        "/api/v1/auth/logout",
        null,
        { skipToast: true },
      );
      expect(navigationMocks.router.replace).toHaveBeenCalledWith("/login");
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("renders back or close controls on auth pages", async () => {
    apiClientMock.post.mockResolvedValue({ accessToken: makeAccessToken() });
    apiClientMock.get.mockResolvedValue({ data: null });

    const pages = [
      <LoginPage key="login" />,
      <RegisterPage key="register" />,
      <ForgotPasswordPage key="forgot" />,
      <ResetPasswordPage key="reset" />,
      <VerifyEmailPage
        key="verify"
        params={Promise.reject(new Error("Invalid token"))}
      />,
    ];

    for (const page of pages) {
      const { unmount } = render(page);
      expect(
        screen.queryByRole("button", { name: /Quay lại/i }) ??
          screen.getByRole("button", { name: /Đóng màn hình/i }),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it("renders verified email success actions", async () => {
    authApiMocks.verifyEmail.mockResolvedValue({
      message: "Email đã được xác thực.",
      data: null,
    });

    render(
      <VerifyEmailPage params={Promise.resolve({ token: "verify-token" })} />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Xác thực email thành công",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Về trang chủ/i })).toHaveAttribute(
      "href",
      "/home",
    );
    expect(
      screen.getByRole("link", { name: /Đăng nhập ngay/i }),
    ).toHaveAttribute("href", "/login");

    fireEvent.click(screen.getByRole("button", { name: "Đóng màn hình" }));

    expect(navigationMocks.router.replace).toHaveBeenCalledWith("/home");
  });

  it("replaces the stale unverified token after email verification succeeds", async () => {
    useAuthStore.getState().setAuth(
      makeAccessToken("USER", "UNVERIFIED"),
      "student",
      {
        id: "user-1",
        email: "student@example.com",
        name: "Nguyen Student",
        role: "student",
        status: "UNVERIFIED",
        createdAt: new Date("2026-06-08T00:00:00.000Z"),
      },
      null,
    );
    authApiMocks.verifyEmail.mockResolvedValue({
      message: "Email đã được xác thực.",
      data: {
        accessToken: makeAccessToken("USER", "ACTIVE"),
      },
    });

    render(
      <VerifyEmailPage params={Promise.resolve({ token: "verify-token" })} />,
    );

    await screen.findByRole("heading", {
      name: "Xác thực email thành công",
    });

    expect(authApiMocks.verifyEmail).toHaveBeenCalledWith({
      token: "verify-token",
      deviceId: expect.any(String),
      deviceType: "WEB",
    });
    expect(useAuthStore.getState().accessToken).toBe(
      makeAccessToken("USER", "ACTIVE"),
    );
    expect(useAuthStore.getState().user?.status).toBe("ACTIVE");
  });
});
