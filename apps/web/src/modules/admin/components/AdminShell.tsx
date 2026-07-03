"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { UserInfo } from "@/components/ui/UserInfo";
import { ADMIN_NAV_ITEMS } from "@/constants/nav.const";
import { logoutCurrentSession } from "@/modules/auth-api";
import { ROUTE_PATHS } from "@/routes/router.const";
import { useAuthStore } from "@/stores/auth/store";

export function AdminShell({
  children,
}: {
  readonly children: ReactNode;
}): React.JSX.Element {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logoutCurrentSession();
    } finally {
      logout();
      router.replace(ROUTE_PATHS.AUTH_ROUTES.LOGIN);
    }
  };

  const navItems = ADMIN_NAV_ITEMS.map((item) =>
    item.href === "#" ? { ...item, action: handleLogout } : item,
  );

  return (
    <DashboardShell
      footerContent={<UserInfo />}
      items={navItems}
      subtitle="Cổng quản trị"
      title="Admin Portal"
    >
      {children}
    </DashboardShell>
  );
}
