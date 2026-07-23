import type { LibraryDocument } from "@/types/document.type";

export const isDocumentReadyForAi = (document: LibraryDocument): boolean =>
  document.ragStatus === "READY" && (document.chunkCount ?? 0) > 0;
