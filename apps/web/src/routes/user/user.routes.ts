/**
 * User Protected Routes
 * Routes that require user authentication
 */

import { ROUTE_PATHS } from "../router.const";

export const USER_PROTECTED_ROUTES = [
  ROUTE_PATHS.PROTECTED_ROUTES.HOME,
  ROUTE_PATHS.PROTECTED_ROUTES.LIBRARY,
  ROUTE_PATHS.PROTECTED_ROUTES.PROFILE,
  ROUTE_PATHS.PROTECTED_ROUTES.SETTINGS,
  ROUTE_PATHS.PROTECTED_ROUTES.UPLOADS,
  ROUTE_PATHS.PROTECTED_ROUTES.FAVORITES,
  ROUTE_PATHS.PROTECTED_ROUTES.MY_DOCUMENTS,
  ROUTE_PATHS.PROTECTED_ROUTES.MY_UPLOADS,
];

export const userRouterConfig = {
  HOME: {
    path: ROUTE_PATHS.PROTECTED_ROUTES.HOME,
    title: "Trang chủ",
    public: false,
    requiresAuth: true,
  },
  LIBRARY: {
    path: ROUTE_PATHS.PROTECTED_ROUTES.LIBRARY,
    title: "Thư viện",
    public: false,
    requiresAuth: true,
  },
  PROFILE: {
    path: ROUTE_PATHS.PROTECTED_ROUTES.PROFILE,
    title: "Hồ sơ cá nhân",
    public: false,
    requiresAuth: true,
  },
  UPLOADS: {
    path: ROUTE_PATHS.PROTECTED_ROUTES.UPLOADS,
    title: "Đóng góp",
    public: false,
    requiresAuth: true,
  },
  SETTINGS: {
    path: ROUTE_PATHS.PROTECTED_ROUTES.SETTINGS,
    title: "Cài đặt",
    public: false,
    requiresAuth: true,
  },
  FAVORITES: {
    path: ROUTE_PATHS.PROTECTED_ROUTES.FAVORITES,
    title: "Tài liệu yêu thích",
    public: false,
    requiresAuth: true,
  },
  MY_DOCUMENTS: {
    path: ROUTE_PATHS.PROTECTED_ROUTES.MY_DOCUMENTS,
    title: "Tài liệu của tôi",
    public: false,
    requiresAuth: true,
  },
  MY_UPLOADS: {
    path: ROUTE_PATHS.PROTECTED_ROUTES.MY_UPLOADS,
    title: "Tài liệu đã tải lên",
    public: false,
    requiresAuth: true,
  },
  CHANGE_PASSWORD: {
    path: ROUTE_PATHS.PROTECTED_ROUTES.CHANGE_PASSWORD,
    title: "Đổi mật khẩu",
    public: false,
    requiresAuth: true,
  },
} as const;

const matchesRouteSegment = (pathname: string, route: string): boolean => {
  return pathname === route || pathname.startsWith(`${route}/`);
};

/**
 * Check if a route requires user authentication
 */
export const isUserProtectedRoute = (pathname: string): boolean => {
  return USER_PROTECTED_ROUTES.some((route) =>
    matchesRouteSegment(pathname, route),
  );
};
