/**
 * Role-Based Access Control Guard
 * Control access to routes based on user role
 */

import { ROUTE_PATHS } from "../router.const";

export type UserRole = "guest" | "student" | "teacher" | "moderator" | "admin";

export interface RoleGuardContext {
  pathname: string;
  userRole?: UserRole;
  requiredRoles?: UserRole[];
}

const matchesRouteSegment = (pathname: string, route: string): boolean => {
  return pathname === route || pathname.startsWith(`${route}/`);
};

/**
 * Role-based route configuration
 */
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

/**
 * Check if user has required role for route
 */
export const hasRoleAccess = (context: RoleGuardContext): boolean => {
  const { pathname, userRole, requiredRoles = [] } = context;

  // If no specific roles required, everyone with auth can access
  if (requiredRoles.length === 0) {
    return true;
  }

  // Check if user role is in required roles
  return userRole ? requiredRoles.includes(userRole) : false;
};

/**
 * Get required role for a route
 */
export const getRequiredRoleForRoute = (pathname: string): UserRole | null => {
  // Check admin routes
  if (
    ROLE_BASED_ROUTES.ADMIN.some((route) =>
      matchesRouteSegment(pathname, route),
    )
  ) {
    return "admin";
  }

  // Check moderator routes
  if (
    ROLE_BASED_ROUTES.MODERATOR.some((route) =>
      matchesRouteSegment(pathname, route),
    )
  ) {
    return "moderator";
  }

  // Check teacher-specific routes
  if (
    ROLE_BASED_ROUTES.TEACHER.some((route) =>
      matchesRouteSegment(pathname, route),
    )
  ) {
    return "teacher";
  }

  // Check student routes
  if (
    ROLE_BASED_ROUTES.STUDENT.some((route) =>
      matchesRouteSegment(pathname, route),
    )
  ) {
    return "student";
  }

  return null;
};

/**
 * Get redirect path based on user role (when accessing unauthorized route)
 */
export const getRoleRedirect = (userRole: UserRole): string => {
  switch (userRole) {
    case "admin":
      return ROUTE_PATHS.ADMIN_ROUTES.DASHBOARD;
    case "moderator":
      return ROUTE_PATHS.MODERATOR_ROUTES.DASHBOARD;
    case "student":
    case "teacher":
      return ROUTE_PATHS.PROTECTED_ROUTES.DASHBOARD;
    case "guest":
    default:
      return ROUTE_PATHS.HOME;
  }
};
