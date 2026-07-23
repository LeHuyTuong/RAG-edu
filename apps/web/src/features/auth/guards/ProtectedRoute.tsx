"use client";

import { useRouter } from "next/navigation";
import { useEffect, type FC, type ReactNode } from "react";

import { useAuth } from "../hooks/use-auth";
import { getLoginRedirectHref } from "../lib/auth.redirect";
import { getRoleRedirect, hasRoleAccess, type UserRole } from "./role.guard";

/**
 * FLOW DOC: apps/web/docs/FRONTEND-CODE-FLOW-VI.md#flow-auth
 * Guard chặn render khi chưa hydrate user, redirect về login nếu thiếu session
 * hoặc về dashboard phù hợp nếu role không đủ quyền.
 */

export interface ProtectedRouteProps {
  readonly children: ReactNode;
  readonly requiredRole?: UserRole;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoadingUser } = useAuth();

  useEffect(() => {
    if (isLoadingUser) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace(
        getLoginRedirectHref(window.location.pathname, window.location.search),
      );
      return;
    }

    if (
      requiredRole &&
      !hasRoleAccess({
        pathname: window.location.pathname,
        userRole: user.role,
        requiredRoles: [requiredRole],
      })
    ) {
      router.replace(getRoleRedirect(user.role));
    }
  }, [isAuthenticated, isLoadingUser, requiredRole, router, user]);

  if (isLoadingUser || !isAuthenticated || !user) {
    return null;
  }

  if (
    requiredRole &&
    !hasRoleAccess({
      pathname: typeof window === "undefined" ? "" : window.location.pathname,
      userRole: user.role,
      requiredRoles: [requiredRole],
    })
  ) {
    return null;
  }

  return <>{children}</>;
};
