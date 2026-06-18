"use client";

import Link from "next/link";
import type { FC } from "react";

import { useAuthStore } from "@/stores/auth/store";
import { ROUTE_PATHS } from "@/routes";
import { isDefaultAvatar } from "@/shared/constants";

export const UserInfo: FC = () => {
  const user = useAuthStore((state) => state.user);

  const initials = (() => {
    if (!user?.name) return "?";
    const parts = user.name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return (first + last).toUpperCase();
  })();

  return (
    <Link
      href={ROUTE_PATHS.PROTECTED_ROUTES.PROFILE}
      className="group flex items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-high/80 p-3 backdrop-blur-[15px] transition-colors hover:bg-surface-container-high"
    >
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-2 ring-primary/20">
        {user?.avatar && !isDefaultAvatar(user.avatar) ? (
          <img
            alt={user.name}
            className="h-full w-full object-cover"
            src={user.avatar}
          />
        ) : (
          <span className="text-sm font-semibold text-primary">{initials}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-label-md text-label-md font-semibold text-on-surface">
          {user?.name ?? "Người dùng"}
        </p>
        <p className="truncate font-label-sm text-label-sm text-on-surface-variant">
          {user?.email ?? user?.role ?? ""}
        </p>
      </div>

      <span className="material-symbols-outlined shrink-0 text-[18px] text-on-surface-variant transition-colors group-hover:text-primary">
        chevron_right
      </span>
    </Link>
  );
};
