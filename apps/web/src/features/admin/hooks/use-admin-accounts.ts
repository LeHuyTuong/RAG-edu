import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi, type FetchAdminAccountsParams } from "../api/admin.api";
import { adminQueryKeys } from "../admin.keys";

async function invalidateAccounts(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
) {
  await queryClient.invalidateQueries({ queryKey: adminQueryKeys.accounts() });
  if (id) {
    await queryClient.invalidateQueries({
      queryKey: adminQueryKeys.account(id),
    });
  }
}

export function useAdminAccounts(params: FetchAdminAccountsParams = {}) {
  return useQuery({
    queryKey: adminQueryKeys.accounts(params),
    queryFn: () => adminApi.getAccounts(params),
  });
}

export function useAdminAccount(id: string, enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.account(id),
    queryFn: () => adminApi.getAccount(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateAdminAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.createAccount,
    onSuccess: () => invalidateAccounts(queryClient),
  });
}

export function useUpdateAdminAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof adminApi.updateAccount>[1];
    }) => adminApi.updateAccount(id, payload),
    onSuccess: (_, { id }) => invalidateAccounts(queryClient, id),
  });
}

export function useToggleAdminAccountBan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.toggleAccountBan,
    onSuccess: (_, id) => invalidateAccounts(queryClient, id),
  });
}

export function useDeleteAdminAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.deleteAccount,
    onSuccess: (_, id) => invalidateAccounts(queryClient, id),
  });
}
