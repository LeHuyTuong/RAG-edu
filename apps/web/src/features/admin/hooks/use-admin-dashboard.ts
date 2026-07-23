import { useQuery } from "@tanstack/react-query";

import { adminApi } from "../api/admin.api";
import { adminQueryKeys } from "../admin.keys";

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminQueryKeys.dashboard(),
    queryFn: () => adminApi.getDashboard(),
  });
}
