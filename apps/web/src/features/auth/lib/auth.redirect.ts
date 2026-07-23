import { ROUTE_PATHS } from "@/routes/router.const";
import type { UserRole } from "@/types";

export function getDefaultRedirectForRole(role: UserRole): string {
  if (role === "admin") return ROUTE_PATHS.ADMIN_ROUTES.DASHBOARD;
  if (role === "moderator") return ROUTE_PATHS.MODERATOR_ROUTES.DASHBOARD;
  return ROUTE_PATHS.PROTECTED_ROUTES.HOME;
}

export function getSafeRedirect(value: string | null, role: UserRole): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return getDefaultRedirectForRole(role);
  }

  return value;
}

export function getLoginRedirectHref(pathname: string, search = ""): string {
  if (
    !pathname ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return "/login";
  }

  return `/login?redirect=${encodeURIComponent(`${pathname}${search}`)}`;
}
