"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { UserInfo } from "@/components/ui/UserInfo";
import { MODERATOR_NAV_ITEMS } from "@/constants/nav.const";
import { useLogout } from "@/features/auth";
import { ROUTE_PATHS } from "@/routes/router.const";

export function ModeratorShell({
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

  const navItems = MODERATOR_NAV_ITEMS.map((item) =>
    item.href === "#" ? { ...item, action: handleLogout } : item,
  );

  return (
    <DashboardShell
      footerContent={<UserInfo />}
      items={navItems}
      subtitle="Cổng kiểm duyệt"
      title="Moderator Portal"
    >
      {children}
    </DashboardShell>
  );
}
