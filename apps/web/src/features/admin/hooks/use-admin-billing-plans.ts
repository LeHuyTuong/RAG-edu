import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "../api/admin.api";
import { adminQueryKeys } from "../admin.keys";

async function invalidateBillingPlans(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: number,
) {
  await queryClient.invalidateQueries({
    queryKey: adminQueryKeys.billingPlans(),
  });
  if (id !== undefined) {
    await queryClient.invalidateQueries({
      queryKey: adminQueryKeys.billingPlan(id),
    });
  }
  await queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() });
}

export function useAdminBillingPlans() {
  return useQuery({
    queryKey: adminQueryKeys.billingPlans(),
    queryFn: () => adminApi.getBillingPlans(),
  });
}

export function useAdminBillingPlan(id: number, enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.billingPlan(id),
    queryFn: () => adminApi.getBillingPlan(id),
    enabled: Number.isFinite(id) && enabled,
  });
}

export function useCreateAdminBillingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.createBillingPlan,
    onSuccess: () => invalidateBillingPlans(queryClient),
  });
}

export function useUpdateAdminBillingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Parameters<typeof adminApi.updateBillingPlan>[1];
    }) => adminApi.updateBillingPlan(id, payload),
    onSuccess: (_, { id }) => invalidateBillingPlans(queryClient, id),
  });
}

export function useDeactivateAdminBillingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.deactivateBillingPlan,
    onSuccess: (_, id) => invalidateBillingPlans(queryClient, id),
  });
}
