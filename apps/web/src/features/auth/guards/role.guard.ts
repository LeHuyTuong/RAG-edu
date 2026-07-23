import { ROUTE_PATHS } from "@/routes/router.const";
import type { UserRole } from "@/types";

export type { UserRole };

export interface RoleGuardContext {
  readonly pathname: string;
  readonly userRole?: UserRole;
  readonly requiredRoles?: UserRole[];
}

const matchesRouteSegment = (pathname: string, route: string): boolean =>
  pathname === route || pathname.startsWith(`${route}/`);

export const ROLE_BASED_ROUTES = {
  ADMIN: [
    ROUTE_PATHS.ADMIN,
    ROUTE_PATHS.ADMIN_ROUTES.DASHBOARD,
    ROUTE_PATHS.ADMIN_ROUTES.USERS,
    ROUTE_PATHS.ADMIN_ROUTES.DOCUMENTS,
    ROUTE_PATHS.ADMIN_ROUTES.CATEGORIES,
    ROUTE_PATHS.ADMIN_ROUTES.REPORTS,
    ROUTE_PATHS.ADMIN_ROUTES.SETTINGS,
  ],
  MODERATOR: [
    ROUTE_PATHS.MODERATOR,
    ROUTE_PATHS.MODERATOR_ROUTES.DASHBOARD,
    ROUTE_PATHS.MODERATOR_ROUTES.DOCUMENTS,
    ROUTE_PATHS.MODERATOR_ROUTES.POSTS,
  ],
  STUDENT: [
    ROUTE_PATHS.PROTECTED_ROUTES.PROFILE,
    ROUTE_PATHS.PROTECTED_ROUTES.SETTINGS,
    ROUTE_PATHS.PROTECTED_ROUTES.FAVORITES,
    ROUTE_PATHS.PROTECTED_ROUTES.MY_DOCUMENTS,
    ROUTE_PATHS.PROTECTED_ROUTES.MY_UPLOADS,
  ],
  TEACHER: [
    ROUTE_PATHS.PROTECTED_ROUTES.PROFILE,
    ROUTE_PATHS.PROTECTED_ROUTES.SETTINGS,
    ROUTE_PATHS.PROTECTED_ROUTES.MY_UPLOADS,
  ],
} as const;

export const hasRoleAccess = ({
  userRole,
  requiredRoles = [],
}: RoleGuardContext): boolean =>
  requiredRoles.length === 0 ||
  Boolean(userRole && requiredRoles.includes(userRole));

export const getRequiredRoleForRoute = (pathname: string): UserRole | null => {
  if (
    ROLE_BASED_ROUTES.ADMIN.some((route) =>
      matchesRouteSegment(pathname, route),
    )
  ) {
    return "admin";
  }

  if (
    ROLE_BASED_ROUTES.MODERATOR.some((route) =>
      matchesRouteSegment(pathname, route),
    )
  ) {
    return "moderator";
  }

  if (
    ROLE_BASED_ROUTES.TEACHER.some((route) =>
      matchesRouteSegment(pathname, route),
    )
  ) {
    return "teacher";
  }

  if (
    ROLE_BASED_ROUTES.STUDENT.some((route) =>
      matchesRouteSegment(pathname, route),
    )
  ) {
    return "student";
  }

  return null;
};

export const getRoleRedirect = (userRole: UserRole): string => {
  switch (userRole) {
    case "admin":
      return ROUTE_PATHS.ADMIN_ROUTES.DASHBOARD;
    case "moderator":
      return ROUTE_PATHS.MODERATOR_ROUTES.DASHBOARD;
    case "student":
    case "teacher":
      return ROUTE_PATHS.PROTECTED_ROUTES.HOME;
    case "guest":
    default:
      return ROUTE_PATHS.HOME;
  }
};
