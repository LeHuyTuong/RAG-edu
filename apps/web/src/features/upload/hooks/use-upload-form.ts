"use client";

import { useCallback, useState } from "react";

import { UPLOAD_ERROR_MESSAGES } from "@/constants/upload.const";
import { getErrorMessage } from "@/utils/error";

import { useCreateUploadedDocument } from "./use-create-uploaded-document";

export interface UploadFormValues {
  title: string;
  subjectId: string;
  description: string;
  originalAuthor: string;
  folderId: string;
  isPublic: boolean;
}

interface UseUploadFormOptions {
  selectedFile: File | null;
  onSuccess: () => void;
}

const initialValues: UploadFormValues = {
  title: "",
  subjectId: "",
  description: "",
  originalAuthor: "",
  folderId: "",
  isPublic: false,
};

export function useUploadForm({
  selectedFile,
  onSuccess,
}: UseUploadFormOptions) {
  const [values, setValues] = useState<UploadFormValues>(initialValues);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createUploadedDocument = useCreateUploadedDocument();

  const setField = useCallback(
    <Field extends keyof UploadFormValues>(
      field: Field,
      value: UploadFormValues[Field],
    ) => {
      setValues((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const submit = useCallback(async () => {
    if (!selectedFile) {
      setSubmitError(UPLOAD_ERROR_MESSAGES.MISSING_FILE);
      return;
    }

    if (!values.title.trim()) {
      setSubmitError(UPLOAD_ERROR_MESSAGES.MISSING_TITLE);
      return;
    }

    setSubmitError(null);

    try {
      await createUploadedDocument.mutateAsync({
        file: selectedFile,
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        originalAuthor: values.originalAuthor.trim() || undefined,
        subjectId: values.subjectId || undefined,
        isPublic: values.isPublic,
        folderId: values.folderId ? Number(values.folderId) : undefined,
      });
      setValues(initialValues);
      onSuccess();
    } catch (error) {
      setSubmitError(
        getErrorMessage(error, {
          400: UPLOAD_ERROR_MESSAGES.CREATE_DOCUMENT_FAILED,
          422: UPLOAD_ERROR_MESSAGES.CREATE_DOCUMENT_FAILED,
        }),
      );
    }
  }, [createUploadedDocument, onSuccess, selectedFile, values]);

  return {
    values,
    setField,
    isSubmitting: createUploadedDocument.isPending,
    submitError,
    submit,
  };
}
