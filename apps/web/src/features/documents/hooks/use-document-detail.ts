import { useQuery } from "@tanstack/react-query";

import { fetchDocumentDetail } from "../api/documents.api";
import { documentKeys } from "../documents.keys";

export function useDocumentDetail(id: string | undefined) {
  return useQuery({
    queryKey: documentKeys.detail(id ?? ""),
    queryFn: () => fetchDocumentDetail(id ?? ""),
    enabled: Boolean(id),
  });
}
