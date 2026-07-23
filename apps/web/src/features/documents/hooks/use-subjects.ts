import { useQuery } from "@tanstack/react-query";

import { fetchSubjects } from "../api/documents.api";
import { documentKeys } from "../documents.keys";

export function useSubjects(limit = 100) {
  return useQuery({
    queryKey: documentKeys.subjects(limit),
    queryFn: () => fetchSubjects(limit),
  });
}
