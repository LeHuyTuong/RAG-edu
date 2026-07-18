"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type FC, type ReactNode } from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { UserInfo } from "@/components/ui/UserInfo";
import { USER_NAV_ITEMS } from "@/constants/nav.const";
import { getCurrentUser, logoutCurrentSession } from "@/modules/auth-api";
import { ROUTE_PATHS } from "@/routes/router.const";
import { useAuthStore } from "@/stores/auth/store";

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
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);

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
  const isFolderWorkspace = /^\/folders\/[^/]+$/.test(pathname);

  if (isFolderWorkspace) {
    return (
      <div className="min-h-screen overflow-hidden bg-background text-foreground">
        {children}
      </div>
    );
  }

  return (
    <DashboardShell
      contentClassName="space-y-4"
      footerContent={<UserInfo />}
      items={navItems}
      subtitle={subtitle}
      title={title}
    >
      {children}
    </DashboardShell>
  );
};
