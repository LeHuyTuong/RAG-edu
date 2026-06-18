"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FC, type ReactNode } from "react";

import { SideNav } from "@/components/layout/SideNav";
import {
  getCurrentUser,
  logoutCurrentSession,
  resendVerificationEmail,
} from "@/modules/auth-api";
import { ROUTE_PATHS } from "@/routes/router.const";
import { useAuthStore } from "@/stores/auth/store";
import { USER_NAV_ITEMS } from "@/constants/nav.const";
import { UserInfo } from "@/components/ui/UserInfo";

export interface UserShellProps {
  readonly children: ReactNode;
  readonly title: string;
  readonly subtitle: string;
}

export const UserShell: FC<UserShellProps> = ({
  children,
  title,
  subtitle,
}) => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const hasFetchedUserRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || hasFetchedUserRef.current) {
      return;
    }

    let isMounted = true;
    hasFetchedUserRef.current = true;

    getCurrentUser()
      .then((user) => {
        if (isMounted && useAuthStore.getState().isAuthenticated) {
          setUser(user);
        }
      })
      .catch(() => {
        hasFetchedUserRef.current = false;
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, setUser]);

  const handleResendVerification = async () => {
    if (isResendingVerification) {
      return;
    }

    setIsResendingVerification(true);
    setVerificationMessage("");

    try {
      const response = await resendVerificationEmail();
      setVerificationMessage(response.message ?? "Email xác thực đã được gửi.");
    } catch (error) {
      setVerificationMessage(
        error instanceof Error
          ? error.message
          : "Không thể gửi lại email xác thực.",
      );
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutCurrentSession();
    } finally {
      logout();
      router.replace(ROUTE_PATHS.AUTH_ROUTES.LOGIN);
    }
  };

  const navItems = USER_NAV_ITEMS.map((item) =>
    item.href === "#" ? { ...item, action: handleLogout } : item,
  );
  const isUnverified = user?.status === "UNVERIFIED";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SideNav
        title={title}
        subtitle={subtitle}
        items={navItems}
        footerContent={<UserInfo />}
      />

      <main className="min-h-screen overflow-x-hidden px-4 py-6 sm:px-6 lg:ml-72 lg:px-8">
        <div className="min-w-0 space-y-4">
          {isUnverified ? (
            <section
              role="status"
              className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="material-symbols-outlined mt-0.5 text-[20px] text-amber-700"
                  aria-hidden="true"
                >
                  mark_email_unread
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    Tài khoản của bạn chưa xác thực email. Vui lòng kiểm tra hộp
                    thư để xác thực.
                  </p>
                  {verificationMessage ? (
                    <p className="mt-1 text-sm text-amber-800">
                      {verificationMessage}
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResendingVerification}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  aria-hidden="true"
                >
                  outgoing_mail
                </span>
                {isResendingVerification
                  ? "Đang gửi..."
                  : "Gửi lại email xác thực"}
              </button>
            </section>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
};
