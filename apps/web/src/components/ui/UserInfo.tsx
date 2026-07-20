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

  const isAdmin = user?.role === "admin";
  const isModerator = user?.role === "moderator";

  const href = isAdmin
    ? ROUTE_PATHS.ADMIN_ROUTES.SETTINGS
    : isModerator
      ? ROUTE_PATHS.MODERATOR_ROUTES.SETTINGS
      : ROUTE_PATHS.PROTECTED_ROUTES.PROFILE;

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3 transition-all duration-200 hover:border-primary/30 hover:bg-surface-container hover:shadow-sm"
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-2 ring-primary/15">
        {user?.avatar && !isDefaultAvatar(user.avatar) ? (
          <img
            alt={user.name}
            className="h-full w-full object-cover"
            src={user.avatar}
          />
        ) : (
          <span className="text-sm font-bold text-primary">{initials}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-on-surface">
          {user?.name ?? "Người dùng"}
        </p>
        <p className="truncate text-[12px] text-on-surface-variant/70 mt-0.5">
          {user?.email ?? user?.role ?? ""}
        </p>
      </div>

      <span className="material-symbols-outlined shrink-0 text-[18px] text-on-surface-variant/50 transition-colors group-hover:text-primary">
        chevron_right
      </span>
    </Link>
  );
};
