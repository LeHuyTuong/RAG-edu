import { documentKeys } from "@/features/documents/documents.keys";
import { normalizeDocumentListQuery } from "@/features/documents/lib/document-query";

test("normalizes document list input before it becomes a query key", () => {
  const query = normalizeDocumentListQuery({
    search: "  kháng chiến  ",
    subjectId: "12",
  });

  expect(query).toEqual({
    page: 1,
    limit: 12,
    search: "kháng chiến",
    subjectId: "12",
  });
  expect(documentKeys.list(query)).toEqual(["documents", "list", query]);
});
