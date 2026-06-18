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

// ── Types ────────────────────────────────────────────────────────────────────

export interface FormValues {
  title: string;
  subjectId: string;
  description: string;
}

/** Raw JSON shape returned by Cloudinary's upload endpoint. */
interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  bytes: number;
  format: string;
  resource_type: string;
}

// ── Cloudinary config (env vars with safe fallbacks) ─────────────────────────

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "ddxstobvd";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

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
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("upload_preset", UPLOAD_PRESET);

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
          { method: "POST", body: formData },
        );

        if (!cloudRes.ok) {
          const body = await cloudRes.text();
          throw new Error(
            `Cloudinary upload thất bại (${cloudRes.status}): ${body}`,
          );
        }

        const cloudData: CloudinaryResponse = await cloudRes.json();

        // ── Step 2: Create document record in the API ─────────────────────
        await createDocument({
          title: formValues.title.trim(),
          description: formValues.description.trim() || undefined,
          fileUrl: cloudData.secure_url,
          publicId: cloudData.public_id,
          sizeInBytes: cloudData.bytes,
          format: cloudData.format,
          resourceType: cloudData.resource_type,
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
