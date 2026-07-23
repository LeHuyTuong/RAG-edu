"use client";

import { usePathname, useRouter } from "next/navigation";
import { type FC, type ReactNode } from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { UserInfo } from "@/components/ui/UserInfo";
import { USER_NAV_ITEMS } from "@/constants/nav.const";
import { useLogout } from "@/features/auth";
import { ROUTE_PATHS } from "@/routes/router.const";

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
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.replace(ROUTE_PATHS.AUTH_ROUTES.LOGIN);
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
