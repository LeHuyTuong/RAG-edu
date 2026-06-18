/**
 * User Authentication Routes
 * Routes for login, register, password reset, email verification
 */

import { ROUTE_PATHS } from "../router.const";

export const AUTH_ROUTES = [
  ROUTE_PATHS.AUTH_ROUTES.LOGIN,
  ROUTE_PATHS.AUTH_ROUTES.REGISTER,
  ROUTE_PATHS.AUTH_ROUTES.FORGOT_PASSWORD,
  ROUTE_PATHS.AUTH_ROUTES.RESET_PASSWORD,
  ROUTE_PATHS.AUTH_ROUTES.VERIFY_EMAIL,
];

export const authRouterConfig = {
  LOGIN: {
    path: ROUTE_PATHS.AUTH_ROUTES.LOGIN,
    title: "Đăng nhập",
    public: true,
    requiresAuth: false,
  },
  REGISTER: {
    path: ROUTE_PATHS.AUTH_ROUTES.REGISTER,
    title: "Đăng ký",
    public: true,
    requiresAuth: false,
  },
  FORGOT_PASSWORD: {
    path: ROUTE_PATHS.AUTH_ROUTES.FORGOT_PASSWORD,
    title: "Quên mật khẩu",
    public: true,
    requiresAuth: false,
  },
  RESET_PASSWORD: {
    path: ROUTE_PATHS.AUTH_ROUTES.RESET_PASSWORD,
    title: "Đặt lại mật khẩu",
    public: true,
    requiresAuth: false,
  },
  VERIFY_EMAIL: {
    path: ROUTE_PATHS.AUTH_ROUTES.VERIFY_EMAIL,
    title: "Xác nhận email",
    public: true,
    requiresAuth: false,
  },
} as const;

/**
 * Check if a route is an auth route
 */
export const isAuthRoute = (pathname: string): boolean => {
  const routeToRegex = (routeTemplate: string): RegExp => {
    // escape regex special chars, then convert :params to a segment matcher
    const escaped = routeTemplate.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const pattern = escaped.replace(/:([a-zA-Z0-9_]+)/g, "[^/]+");
    return new RegExp(`^${pattern}$`);
  };

  return AUTH_ROUTES.some((route) => routeToRegex(route).test(pathname));
};
