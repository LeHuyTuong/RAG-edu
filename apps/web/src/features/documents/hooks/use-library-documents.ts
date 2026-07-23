import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import type {
  DocumentsListResponse,
  ListDocumentsQuery,
} from "@/types/document.type";

import { fetchDocuments } from "../api/documents.api";
import { documentKeys } from "../documents.keys";
import { normalizeDocumentListQuery } from "../lib/document-query";

type LibraryDocumentsOptions = Pick<
  UseQueryOptions<DocumentsListResponse>,
  "enabled"
>;

export function useLibraryDocuments(
  query: ListDocumentsQuery = {},
  options: LibraryDocumentsOptions = {},
) {
  const normalizedQuery = normalizeDocumentListQuery(query);

  return useQuery({
    queryKey: documentKeys.list(normalizedQuery),
    queryFn: () => fetchDocuments(normalizedQuery),
    ...options,
  });
}
