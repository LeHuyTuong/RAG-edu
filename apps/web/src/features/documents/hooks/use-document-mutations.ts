import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  DocumentDetail,
  UpdateDocumentPayload,
} from "@/types/document.type";

import {
  createDocument,
  createShareLink,
  deleteDocument,
  hardDeleteDocument,
  restoreDocument,
  revokeShareLink,
  updateDocument,
} from "../api/documents.api";
import { documentKeys } from "../documents.keys";

async function invalidateDocumentViews(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: documentKeys.lists() }),
    queryClient.invalidateQueries({
      queryKey: [...documentKeys.all, "mine"],
    }),
    queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) }),
  ]);
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateDocumentPayload;
    }) => updateDocument(id, payload),
    onSuccess: async (_, { id }) => invalidateDocumentViews(queryClient, id),
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDocument,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: documentKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: [...documentKeys.all, "mine"],
        }),
      ]);
    },
  });
}

function useDocumentAction(action: (id: string) => Promise<void>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: action,
    onSuccess: async (_, id) => invalidateDocumentViews(queryClient, id),
  });
}

export function useDeleteDocument() {
  return useDocumentAction(deleteDocument);
}

export function useRestoreDocument() {
  return useDocumentAction(restoreDocument);
}

export function useHardDeleteDocument() {
  return useDocumentAction(hardDeleteDocument);
}

export function useEnableShareLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShareLink,
    onSuccess: (response, id) => {
      queryClient.setQueryData<DocumentDetail>(
        documentKeys.detail(id),
        (document) =>
          document
            ? {
                ...document,
                shareEnabled: true,
                shareToken: response.shareToken,
              }
            : document,
      );
    },
  });
}

export function useDisableShareLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeShareLink,
    onSuccess: (_, id) => {
      queryClient.setQueryData<DocumentDetail>(
        documentKeys.detail(id),
        (document) =>
          document
            ? { ...document, shareEnabled: false, shareToken: null }
            : document,
      );
    },
  });
}
