import { useQuery } from "@tanstack/react-query";

import type { ListDocumentsQuery } from "@/types/document.type";

import { fetchMyDocuments } from "../api/documents.api";
import { documentKeys } from "../documents.keys";
import { normalizeDocumentListQuery } from "../lib/document-query";

export function useMyDocuments(query: ListDocumentsQuery = {}) {
  const normalizedQuery = normalizeDocumentListQuery(query);

  return useQuery({
    queryKey: documentKeys.mine(normalizedQuery),
    queryFn: () => fetchMyDocuments(normalizedQuery),
  });
}
