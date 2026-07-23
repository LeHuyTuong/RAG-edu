import { useCurrentUser } from "./use-current-user";
import { useLogout } from "./use-auth-mutations";
import { useAuthStore } from "../store/auth.store";

/**
 * FLOW DOC: apps/web/docs/FRONTEND-CODE-FLOW-VI.md#flow-auth
 * Facade cho component/guard: ghép token trong Zustand với current user trong
 * React Query để tạo một auth contract duy nhất.
 */

export function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useCurrentUser();
  const logout = useLogout();

  return {
    accessToken,
    user: currentUser.data ?? null,
    isAuthenticated: Boolean(accessToken && currentUser.data),
    isLoadingUser: Boolean(accessToken) && currentUser.isLoading,
    userError: currentUser.error,
    logout,
  };
}
