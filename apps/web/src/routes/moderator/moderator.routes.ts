/**
 * Moderator routes and route configuration
 * Routes are used for role-based navigation and guards.
 */

import { ROUTE_PATHS } from "../router.const";

export const MODERATOR_ROUTES = [
  ROUTE_PATHS.MODERATOR,
  ROUTE_PATHS.MODERATOR_ROUTES.DASHBOARD,
  ROUTE_PATHS.MODERATOR_ROUTES.DOCUMENTS,
  ROUTE_PATHS.MODERATOR_ROUTES.DOCUMENT_DETAIL,
  ROUTE_PATHS.MODERATOR_ROUTES.POSTS,
];

export const moderatorRouterConfig = {
  DASHBOARD: {
    path: ROUTE_PATHS.MODERATOR_ROUTES.DASHBOARD,
    title: "Bảng điều khiển",
    public: false,
    requiresAuth: true,
    requiresRole: "moderator" as const,
  },
  DOCUMENTS: {
    path: ROUTE_PATHS.MODERATOR_ROUTES.DOCUMENTS,
    title: "Duyệt tài liệu",
    public: false,
    requiresAuth: true,
    requiresRole: "moderator" as const,
  },
  POSTS: {
    path: ROUTE_PATHS.MODERATOR_ROUTES.POSTS,
    title: "Kiểm duyệt bài viết",
    public: false,
    requiresAuth: true,
    requiresRole: "moderator" as const,
  },
} as const;

const matchesRouteSegment = (pathname: string, route: string): boolean => {
  return pathname === route || pathname.startsWith(`${route}/`);
};

export const isModeratorRoute = (pathname: string): boolean => {
  return MODERATOR_ROUTES.some((route) => matchesRouteSegment(pathname, route));
};
