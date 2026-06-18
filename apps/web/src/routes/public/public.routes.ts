/**
 * Public Routes
 * Routes accessible to everyone (no authentication required)
 */

import { ROUTE_PATHS } from "../router.const";

export const PUBLIC_ROUTES = [
  ROUTE_PATHS.HOME,
  ROUTE_PATHS.STYLE_GUIDE,
  ROUTE_PATHS.ABOUT,
  ROUTE_PATHS.TERMS,
  ROUTE_PATHS.PRIVACY,
];

export const publicRouterConfig = {
  HOME: {
    path: ROUTE_PATHS.HOME,
    title: "Trang chủ",
    public: true,
    requiresAuth: false,
  },
  STYLE_GUIDE: {
    path: ROUTE_PATHS.STYLE_GUIDE,
    title: "Style Guide",
    public: true,
    requiresAuth: false,
  },
  ABOUT: {
    path: ROUTE_PATHS.ABOUT,
    title: "Về chúng tôi",
    public: true,
    requiresAuth: false,
  },
  TERMS: {
    path: ROUTE_PATHS.TERMS,
    title: "Điều khoản sử dụng",
    public: true,
    requiresAuth: false,
  },
  PRIVACY: {
    path: ROUTE_PATHS.PRIVACY,
    title: "Chính sách bảo mật",
    public: true,
    requiresAuth: false,
  },
} as const;

const matchesRouteSegment = (pathname: string, route: string): boolean => {
  return pathname === route || pathname.startsWith(`${route}/`);
};

/**
 * Check if a route is public
 */
export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some((route) =>
    route === "/" ? pathname === "/" : matchesRouteSegment(pathname, route),
  );
};
