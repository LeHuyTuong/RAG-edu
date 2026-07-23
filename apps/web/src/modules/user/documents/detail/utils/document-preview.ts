import { fetchDocumentFile } from "@/features/documents/api/documents.api";
import { loadDocumentPreview as buildDocumentPreview } from "@/features/documents/lib/detail/document-preview";
import type { DocumentDetail } from "@/types/document.type";

export async function loadDocumentPreview(
  document: DocumentDetail,
  accessToken: string,
) {
  const { blob } = await fetchDocumentFile(document.id, accessToken);
  return buildDocumentPreview(document, blob);
}
