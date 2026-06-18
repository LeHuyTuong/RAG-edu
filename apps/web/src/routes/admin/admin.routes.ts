/**
 * Admin Routes
 * Routes for admin dashboard and management
 * Requires admin role access
 */

import { ROUTE_PATHS } from "../router.const";

export const ADMIN_ROUTES = [
  ROUTE_PATHS.ADMIN,
  ROUTE_PATHS.ADMIN_ROUTES.DASHBOARD,
  ROUTE_PATHS.ADMIN_ROUTES.USERS,
  ROUTE_PATHS.ADMIN_ROUTES.DOCUMENTS,
  ROUTE_PATHS.ADMIN_ROUTES.CATEGORIES,
  ROUTE_PATHS.ADMIN_ROUTES.REPORTS,
  ROUTE_PATHS.ADMIN_ROUTES.SETTINGS,
];

export const adminRouterConfig = {
  DASHBOARD: {
    path: ROUTE_PATHS.ADMIN_ROUTES.DASHBOARD,
    title: "Bảng điều khiển",
    public: false,
    requiresAuth: true,
    requiresRole: "admin" as const,
  },
  USERS: {
    path: ROUTE_PATHS.ADMIN_ROUTES.USERS,
    title: "Quản lý người dùng",
    public: false,
    requiresAuth: true,
    requiresRole: "admin" as const,
  },
  DOCUMENTS: {
    path: ROUTE_PATHS.ADMIN_ROUTES.DOCUMENTS,
    title: "Quản lý tài liệu",
    public: false,
    requiresAuth: true,
    requiresRole: "admin" as const,
  },
  CATEGORIES: {
    path: ROUTE_PATHS.ADMIN_ROUTES.CATEGORIES,
    title: "Quản lý danh mục",
    public: false,
    requiresAuth: true,
    requiresRole: "admin" as const,
  },
  REPORTS: {
    path: ROUTE_PATHS.ADMIN_ROUTES.REPORTS,
    title: "Báo cáo",
    public: false,
    requiresAuth: true,
    requiresRole: "admin" as const,
  },
  SETTINGS: {
    path: ROUTE_PATHS.ADMIN_ROUTES.SETTINGS,
    title: "Cài đặt",
    public: false,
    requiresAuth: true,
    requiresRole: "admin" as const,
  },
} as const;

const matchesRouteSegment = (pathname: string, route: string): boolean => {
  return pathname === route || pathname.startsWith(`${route}/`);
};

/**
 * Check if a route is admin route
 */
export const isAdminRoute = (pathname: string): boolean => {
  return ADMIN_ROUTES.some((route) => matchesRouteSegment(pathname, route));
};
