import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "../api/admin.api";
import { adminQueryKeys } from "../admin.keys";

export function useAdminConfig() {
  return useQuery({
    queryKey: adminQueryKeys.config(),
    queryFn: () => adminApi.getConfig(),
  });
}

export function useUpdateAdminConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.updateConfig,
    onSuccess: (config) => {
      queryClient.setQueryData(adminQueryKeys.config(), config);
    },
  });
}
