import { useMutation } from "@tanstack/react-query";

import { useCreateDocument } from "@/features/documents";
import type { CreateDocumentPayload } from "@/types/document.type";

import { uploadFile } from "../api/upload.api";

export interface CreateUploadedDocumentInput extends Omit<
  CreateDocumentPayload,
  "fileUrl" | "publicId" | "sizeInBytes" | "format" | "resourceType"
> {
  file: File;
}

export function useCreateUploadedDocument() {
  const createDocument = useCreateDocument();

  return useMutation({
    mutationFn: async ({ file, ...payload }: CreateUploadedDocumentInput) => {
      const uploadedFile = await uploadFile(file);

      return createDocument.mutateAsync({ ...payload, ...uploadedFile });
    },
  });
}
