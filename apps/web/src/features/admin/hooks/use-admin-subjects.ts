import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi, type FetchAdminSubjectsParams } from "../api/admin.api";
import { adminQueryKeys } from "../admin.keys";

async function invalidateSubjects(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
) {
  await queryClient.invalidateQueries({ queryKey: adminQueryKeys.subjects() });
  if (id) {
    await queryClient.invalidateQueries({
      queryKey: adminQueryKeys.subject(id),
    });
  }
}

export function useAdminSubjects(params: FetchAdminSubjectsParams = {}) {
  return useQuery({
    queryKey: adminQueryKeys.subjects(params),
    queryFn: () => adminApi.getSubjects(params),
  });
}

export function useAdminSubject(id: string, enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.subject(id),
    queryFn: () => adminApi.getSubject(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateAdminSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.createSubject,
    onSuccess: () => invalidateSubjects(queryClient),
  });
}

export function useUpdateAdminSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof adminApi.updateSubject>[1];
    }) => adminApi.updateSubject(id, payload),
    onSuccess: (_, { id }) => invalidateSubjects(queryClient, id),
  });
}

export function useDeleteAdminSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.deleteSubject,
    onSuccess: (_, id) => invalidateSubjects(queryClient, id),
  });
}
