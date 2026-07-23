import type { ListDocumentsQuery } from "@/types/document.type";

import { normalizeDocumentListQuery } from "./lib/document-query";

export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (query: ListDocumentsQuery = {}) =>
    [...documentKeys.lists(), normalizeDocumentListQuery(query)] as const,
  mine: (query: ListDocumentsQuery = {}) =>
    [...documentKeys.all, "mine", normalizeDocumentListQuery(query)] as const,
  detail: (id: string) => [...documentKeys.all, "detail", id] as const,
  subjects: (limit = 100) => [...documentKeys.all, "subjects", limit] as const,
};
