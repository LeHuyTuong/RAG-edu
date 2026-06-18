/**
 * Library Routes
 * Routes for document library and browsing
 */

import { ROUTE_PATHS } from "../router.const";

export const LIBRARY_ROUTES = [ROUTE_PATHS.LIBRARY, ROUTE_PATHS.LIBRARY_DETAIL];

export const libraryRouterConfig = {
  LIBRARY: {
    path: ROUTE_PATHS.LIBRARY,
    title: "Thư viện tài liệu",
    public: true,
    requiresAuth: false,
  },
  LIBRARY_DETAIL: {
    path: ROUTE_PATHS.LIBRARY_DETAIL,
    title: "Chi tiết tài liệu",
    public: true,
    requiresAuth: false,
  },
} as const;

/**
 * Check if a route is a library route
 */
export const isLibraryRoute = (pathname: string): boolean => {
  return LIBRARY_ROUTES.some(
    (route) =>
      pathname === route || pathname.startsWith(route.replace(":id", "")),
  );
};
