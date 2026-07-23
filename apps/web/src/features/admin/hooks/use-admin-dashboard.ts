import { useQuery } from "@tanstack/react-query";

import { adminApi } from "../api/admin.api";
import { adminQueryKeys } from "../admin.keys";

/**
 * FLOW DOC: apps/web/docs/FRONTEND-CODE-FLOW-VI.md#flow-admin
 * React Query hook tách dashboard server state khỏi AdminDashboardPage.
 */

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminQueryKeys.dashboard(),
    queryFn: () => adminApi.getDashboard(),
  });
}
