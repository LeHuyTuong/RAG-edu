/**
 * Route configuration for AI Study Hub
 * All routes organized by section for easy management
 */

export const ROUTE_PATHS = {
  // ========== PUBLIC ROUTES (Any user can access) ==========
  HOME: "/",
  LIBRARY: "/library",
  LIBRARY_DETAIL: "/library/:id",
  ABOUT: "/about",
  STYLE_GUIDE: "/style-guide",
  TERMS: "/terms",
  PRIVACY: "/privacy",

  // ========== AUTH ROUTES (For unauthenticated users) ==========
  AUTH: "/user",
  AUTH_ROUTES: {
    LOGIN: "/login",
    REGISTER: "/register",
  },

  // ========== PROTECTED ROUTES (Require authentication) ==========
  PROTECTED: "/dashboard",
  PROTECTED_ROUTES: {
    HOME: "/home",
    DASHBOARD: "/dashboard",
    LIBRARY: "/library",
    PROFILE: "/profile",
    SETTINGS: "/settings",
    UPLOADS: "/uploads",
    BILLING: "/billing",
    FAVORITES: "/favorites",
    MY_DOCUMENTS: "/my-documents",
    MY_UPLOADS: "/my-uploads",
  },

  // ========== ADMIN ROUTES (Require admin role) ==========
  ADMIN: "/admin",
  ADMIN_ROUTES: {
    DASHBOARD: "/admin",
    USERS: "/admin/users",
    DOCUMENTS: "/admin/documents",
    DOCUMENT_DETAIL: "/admin/documents/:id",
    CATEGORIES: "/admin/categories",
    SUBJECTS: "/admin/subjects",
    BILLING: "/admin/billing",
    REPORTS: "/admin/reports",

    SETTINGS: "/admin/settings",
  },
} as const;

/**
 * Get route with optional parameters
 * @example getRoutePath(ROUTE_PATHS.LIBRARY_DETAIL, { id: '456' })
 */
export const getRoutePath = (
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
