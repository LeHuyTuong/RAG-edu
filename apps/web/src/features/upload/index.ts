/**
 * FLOW DOC: apps/web/docs/FRONTEND-CODE-FLOW-VI.md#flow-upload
 * Public API của upload feature, hiện expose config query và mutation tạo
 * uploaded document cho UploadPage.
 */

export { useCreateUploadedDocument } from "./hooks/use-create-uploaded-document";
export { uploadKeys, useUploadConfig } from "./hooks/use-upload-config";
