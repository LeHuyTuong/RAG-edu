"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { SideNav } from "@/components/layout/SideNav";
import { logoutCurrentSession } from "@/modules/auth-api";
import { ROUTE_PATHS } from "@/routes/router.const";
import { useAuthStore } from "@/stores/auth/store";
import { MODERATOR_NAV_ITEMS } from "@/constants/nav.const";
import { UserInfo } from "@/components/ui/UserInfo";

export function ModeratorShell({
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

  const navItems = MODERATOR_NAV_ITEMS.map((item) =>
    item.href === "#" ? { ...item, action: handleLogout } : item,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SideNav
        title="Moderator Portal"
        subtitle="Cổng kiểm duyệt"
        items={navItems}
        footerContent={<UserInfo />}
      />

      <main className="min-h-screen overflow-x-hidden px-margin-mobile py-8 lg:ml-72 lg:px-margin-desktop">
        <div className="mx-auto w-full min-w-0 max-w-container-max">
          {children}
        </div>
      </main>
    </div>
  );
}
