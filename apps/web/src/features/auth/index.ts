/**
 * FLOW DOC: apps/web/docs/FRONTEND-CODE-FLOW-VI.md#flow-auth
 * Public API của auth feature: component bên ngoài lấy hook/guard/store từ đây.
 */

export { useAuth } from "./hooks/use-auth";
export { useCurrentUser } from "./hooks/use-current-user";
export { useSetCurrentUser } from "./hooks/use-current-user-cache";
export { useLogin, useLogout, useRegister } from "./hooks/use-auth-mutations";
export { useAuthStore } from "./store/auth.store";
export {
  ProtectedRoute,
  type ProtectedRouteProps,
} from "./guards/ProtectedRoute";
