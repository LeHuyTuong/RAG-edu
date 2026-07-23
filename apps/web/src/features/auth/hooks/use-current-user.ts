import { useQuery } from "@tanstack/react-query";

import { fetchCurrentUser } from "../api/auth.api";
import { authKeys } from "../auth.keys";
import { useAuthStore } from "../store/auth.store";

export function useCurrentUser() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: fetchCurrentUser,
    enabled: Boolean(accessToken),
    retry: false,
  });
}
