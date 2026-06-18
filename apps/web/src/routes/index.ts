/**
 * Route exports for AI Study Hub
 * Organized by role/section
 */

// Public routes
export * from "./public/public.routes";

// User auth routes
export * from "./user/user.routes";
export * from "./user/user.auth.routes";

// Library routes
export * from "./library/library.routes";

// Moderator routes
export * from "./moderator/moderator.routes";

// Admin routes
export * from "./admin/admin.routes";

// Route guards
export * from "./guards/auth.guard";
export * from "./guards/role.guard";

// Protected route component
export { ProtectedRoute, type ProtectedRouteProps } from "./ProtectedRoute";
export { GuestRoute, type GuestRouteProps } from "./GuestRoute";

// Main route config
export { ROUTE_PATHS, getRoutePath } from "./router.const";
