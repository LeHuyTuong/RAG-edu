"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { UserInfo } from "@/components/ui/UserInfo";
import { ADMIN_NAV_ITEMS } from "@/constants/nav.const";
import { useLogout } from "@/features/auth";
import { ROUTE_PATHS } from "@/routes/router.const";

export function AdminShell({
  children,
}: {
  readonly children: ReactNode;
}): React.JSX.Element {
  const router = useRouter();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.replace(ROUTE_PATHS.AUTH_ROUTES.LOGIN);
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
