"use client";

/**
 * useDocumentUpload — unified hook for the upload flow.
 *
 * Step 1: User selects / drops a file (stored in state, validated locally).
 * Step 2: User fills the metadata form (title, subject, description).
 * Step 3: On submit, the hook:
 *   a) Uploads the file to Cloudinary (unsigned preset).
 *   b) Posts the resulting metadata + form values to POST /api/v1/documents.
 *
 * isPublic=false → "Riêng tư" (ACTIVE, private)
 * isPublic=true  → "Công khai tài liệu" (PENDING, awaiting moderation)
 */

import { useCallback, useRef, useState } from "react";
import { validateFile } from "@/utils/validate.file";
import { createDocument } from "@/apis/document.api";
import { DEFAULT_UPLOAD_CONFIG } from "@/constants/upload.const";
import {
  uploadFileToCloudinary,
  UPLOAD_PRESET,
} from "../utils/cloudinary-upload";

// ── Types ────────────────────────────────────────────────────────────────────

export interface FormValues {
  title: string;
  subjectId: string;
  description: string;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDocumentUpload() {
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Form state
  const [formValues, setFormValues] = useState<FormValues>({
    title: "",
    subjectId: "",
    description: "",
  });

  // Submit state
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // ── File selection helpers ───────────────────────────────────────────────

  /** Validates and stores a single File from any input source. */
  const selectFile = useCallback((file: File) => {
    const result = validateFile(file, DEFAULT_UPLOAD_CONFIG);
    if (!result.valid) {
      setFileError(result.error ?? "Tệp không hợp lệ.");
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
  }, []);

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) selectFile(file);
      // Reset the input so the same file can be re-selected after removal
      e.target.value = "";
    },
    [selectFile],
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) selectFile(file);
    },
    [selectFile],
  );

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setFileError(null);
  }, []);

  // ── Form helpers ─────────────────────────────────────────────────────────

  const setFormField = useCallback((field: keyof FormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────

  /**
   * Uploads the file to Cloudinary then creates the document record in the API.
   * @param isPublic true → "Công khai tài liệu"; false → "Riêng tư"
   */
  const handleSubmit = useCallback(
    async (isPublic: boolean) => {
      if (isSubmittingRef.current) {
        return;
      }

      // ── Client-side validation ───────────────────────────────────────────
      if (!selectedFile) {
        setSubmitError("Vui lòng chọn tệp tài liệu.");
        return;
      }
      if (!formValues.title.trim()) {
        setSubmitError("Vui lòng nhập tên tài liệu.");
        return;
      }
      if (!UPLOAD_PRESET) {
        setSubmitError(
          "Chưa cấu hình Cloudinary upload preset. Liên hệ quản trị viên.",
        );
        return;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        // ── Step 1: Upload file to Cloudinary ────────────────────────────
        const cloudData = await uploadFileToCloudinary(selectedFile);

        // ── Step 2: Create document record in the API ─────────────────────
        await createDocument({
          title: formValues.title.trim(),
          description: formValues.description.trim() || undefined,
          fileUrl: cloudData.url,
          publicId: cloudData.publicId,
          sizeInBytes: cloudData.bytes,
          format: cloudData.format,
          resourceType: cloudData.resourceType,
          subjectId: formValues.subjectId || undefined,
          isPublic,
        });

        // ── Reset state on success ────────────────────────────────────────
        setIsSuccess(true);
        setSelectedFile(null);
        setFormValues({ title: "", subjectId: "", description: "" });
      } catch (err) {
        setSubmitError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi. Vui lòng thử lại.",
        );
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [selectedFile, formValues],
  );

  return {
    // File
    selectedFile,
    isDragging,
    fileError,
    onFileInputChange,
    onDragOver,
    onDragLeave,
    onDrop,
    removeFile,
    // Form
    formValues,
    setFormField,
    // Submit
    isSubmitting,
    submitError,
    isSuccess,
    setIsSuccess,
    handleSubmit,
  };
}
