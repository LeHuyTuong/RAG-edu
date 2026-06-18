export type DocumentPreviewType =
  | "pdf"
  | "docx"
  | "txt"
  | "image"
  | "unsupported";

export interface DocumentPreviewData {
  readonly type: DocumentPreviewType;

  readonly fileUrl?: string;

  readonly file?: Blob;

  readonly textContent?: string;

  readonly images?: readonly string[];
}
