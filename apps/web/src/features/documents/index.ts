/**
 * FLOW DOC: apps/web/docs/FRONTEND-CODE-FLOW-VI.md#flow-documents
 * Public API của documents feature: query/mutation hook và query keys dùng lại
 * bởi upload, rag và admin.
 */

export { documentKeys } from "./documents.keys";
export { useDocumentDetail } from "./hooks/use-document-detail";
export { useDocumentFileActions } from "./hooks/use-document-file-actions";
export { useDocumentPreview } from "./hooks/use-document-preview";
export {
  useCreateDocument,
  useDeleteDocument,
  useDisableShareLink,
  useEnableShareLink,
  useApproveDocument,
  useHardDeleteDocument,
  useReclassifyDocument,
  useRejectDocument,
  useRestoreDocument,
  useUpdateDocument,
} from "./hooks/use-document-mutations";
export { useFolderOptions } from "./hooks/use-folder-options";
export { useLibraryDocuments } from "./hooks/use-library-documents";
export { useMyDocuments } from "./hooks/use-my-documents";
export { useSubjects } from "./hooks/use-subjects";
