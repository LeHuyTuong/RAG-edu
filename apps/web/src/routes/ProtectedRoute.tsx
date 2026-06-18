/**
 * ProtectedRoute Component
 * Wrapper component for protecting routes based on authentication and roles
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FC, type ReactNode } from "react";
import { completeGoogleLoginFromLocation } from "@/modules/google-auth";
import { getAuthSession } from "./guards/auth.guard";
import {
  hasRoleAccess,
  getRoleRedirect,
  type UserRole,
} from "./guards/role.guard";

export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

/**
 * Client-side route protection component
 * Usage:
 * <ProtectedRoute requiredRole="admin">
 *   <AdminDashboard />
 * </ProtectedRoute>
 */
export const ProtectedRoute: FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("guest");

  useEffect(() => {
    setMounted(true);
    completeGoogleLoginFromLocation();
    const { isAuthenticated: isAuth, user } = getAuthSession();
    const role = (user?.role || "guest") as UserRole;

    setIsAuthenticated(isAuth);
    setUserRole(role);

    // Check authentication
    if (!isAuth) {
      router.replace(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }

    // Check role-based access
    if (
      requiredRole &&
      !hasRoleAccess({
        pathname: window.location.pathname,
        userRole: role,
        requiredRoles: [requiredRole],
      })
    ) {
      router.replace(getRoleRedirect(role));
      return;
    }
  }, [requiredRole, router]);

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (
    requiredRole &&
    !hasRoleAccess({
      pathname: typeof window !== "undefined" ? window.location.pathname : "",
      userRole,
      requiredRoles: [requiredRole],
    })
  ) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
