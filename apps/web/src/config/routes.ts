/**
 * Routes Configuration
 * Centralized route management for the application
 */

export type RouteKey = keyof typeof ROUTE_PATHS;

/**
 * All application routes
 * This single source of truth prevents typos and makes route changes easier
 */
export const ROUTE_PATHS = {
  // Public Routes
  HOME: "/",

  // Auth Routes
  USER_LOGIN: "/login",
  USER_REGISTER: "/register",
  USER_FORGOT_PASSWORD: "/forgot-password",
  USER_RESET_PASSWORD: "/reset-password/:token",
  USER_VERIFY_EMAIL: "/verify-email/:token",

  // Library Routes
  LIBRARY: "/library",
  LIBRARY_DETAIL: "/library/:id",

  // Protected Routes (Placeholder for future)
  PROFILE: "/profile",
  SETTINGS: "/settings",
  FAVORITES: "/favorites",
  MY_DOCUMENTS: "/my-documents",

  // Admin Routes
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_SETTINGS: "/admin/settings",
} as const;

/**
 * Route metadata for navigation, permissions, etc.
 */
export const ROUTE_METADATA = {
  [ROUTE_PATHS.HOME]: {
    title: "Trang chủ",
    public: true,
    requiresAuth: false,
  },
  [ROUTE_PATHS.USER_LOGIN]: {
    title: "Đăng nhập",
    public: true,
    requiresAuth: false,
  },
  [ROUTE_PATHS.USER_REGISTER]: {
    title: "Đăng ký",
    public: true,
    requiresAuth: false,
  },
  [ROUTE_PATHS.USER_FORGOT_PASSWORD]: {
    title: "Quên mật khẩu",
    public: true,
    requiresAuth: false,
  },
  [ROUTE_PATHS.USER_RESET_PASSWORD]: {
    title: "Đặt lại mật khẩu",
    public: true,
    requiresAuth: false,
  },
  [ROUTE_PATHS.USER_VERIFY_EMAIL]: {
    title: "Xác nhận email",
    public: true,
    requiresAuth: false,
  },
  [ROUTE_PATHS.LIBRARY]: {
    title: "Thư viện",
    public: true,
    requiresAuth: false,
  },
  [ROUTE_PATHS.PROFILE]: {
    title: "Hồ sơ cá nhân",
    public: false,
    requiresAuth: true,
  },
  [ROUTE_PATHS.SETTINGS]: {
    title: "Cài đặt",
    public: false,
    requiresAuth: true,
  },
  [ROUTE_PATHS.ADMIN]: {
    title: "Bảng điều khiển quản trị",
    public: false,
    requiresAuth: true,
    requiresRole: "admin",
  },
  [ROUTE_PATHS.ADMIN_USERS]: {
    title: "Quản lý người dùng",
    public: false,
    requiresAuth: true,
    requiresRole: "admin",
  },
  [ROUTE_PATHS.ADMIN_SETTINGS]: {
    title: "Cài đặt hệ thống",
    public: false,
    requiresAuth: true,
    requiresRole: "admin",
  },
} as const;

/**
 * Get a route by key with optional parameters
 * Usage: getRoute(ROUTE_PATHS.LIBRARY_DETAIL, { id: '123' })
 */
export const getRoute = (
  path: string,
  params?: Record<string, string | number>,
): string => {
  let result = path;

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(`:${key}`, String(value));
    });
  }

  return result;
};

/**
 * Check if a route requires authentication
 */
export const requiresAuth = (path: string): boolean => {
  const metadata = ROUTE_METADATA[path as keyof typeof ROUTE_METADATA];
  return metadata?.requiresAuth ?? false;
};

/**
 * Get route title
 */
export const getRouteTitle = (path: string): string => {
  const metadata = ROUTE_METADATA[path as keyof typeof ROUTE_METADATA];
  return metadata?.title ?? "AI Study Hub";
};
