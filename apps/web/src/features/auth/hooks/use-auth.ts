import { useCurrentUser } from "./use-current-user";
import { useLogout } from "./use-auth-mutations";
import { useAuthStore } from "../store/auth.store";

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
