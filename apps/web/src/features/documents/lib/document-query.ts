import type { ListDocumentsQuery } from "@/types/document.type";

export function normalizeDocumentListQuery(
  query: ListDocumentsQuery = {},
): ListDocumentsQuery {
  const search = query.search?.trim();

  return {
    page: query.page ?? 1,
    limit: query.limit ?? 12,
    ...(search ? { search } : {}),
    ...(query.folderId ? { folderId: query.folderId } : {}),
    ...(query.subjectId ? { subjectId: query.subjectId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.onlyMine !== undefined ? { onlyMine: query.onlyMine } : {}),
  };
}
