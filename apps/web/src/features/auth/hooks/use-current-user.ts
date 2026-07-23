import { useQuery } from "@tanstack/react-query";

import { fetchCurrentUser } from "../api/auth.api";
import { authKeys } from "../auth.keys";
import { useAuthStore } from "../store/auth.store";

/**
 * FLOW DOC: apps/web/docs/FRONTEND-CODE-FLOW-VI.md#flow-auth
 * Chỉ gọi /auth/me khi auth store đã có access token; query này là nguồn user
 * profile cho ProtectedRoute và các màn hình cần thông tin người dùng.
 */

export function useCurrentUser() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: fetchCurrentUser,
    enabled: Boolean(accessToken),
    retry: false,
  });
}
