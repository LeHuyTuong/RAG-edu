"use client";

/**
 * DocumentUploadForm
 *
 * Handles the metadata form and the full two-phase submit:
 *   Phase 1 – Upload the file to Cloudinary (unsigned preset).
 *   Phase 2 – POST /api/v1/documents with Cloudinary result + form values.
 *
 * Both phases run inside a single loading state triggered by one button,
 * so the user experiences a single action: fill → toggle → click → done.
 *
 * Props:
 *  - selectedFile        — the File held by the parent (UploadPage); required
 *                          before the submit button becomes active.
 *  - onSubmittingChange  — callback so the parent can mirror the loading state.
 *  - onSuccess           — called after the document record is created.
 *
 * Subjects come from GET /api/v1/subjects (real API, not mock data).
 * "Trường học" is read-only — it is derived from the subject on the backend.
 *
 * Error handling:
 *   - Client-side validation (missing file/title/config) uses fixed
 *     messages from UPLOAD_ERROR_MESSAGES.
 *   - Cloudinary upload failures use a fixed message — Cloudinary's raw
 *     response body is logged via console.error but never shown.
 *   - Backend (createDocument) errors are mapped via getErrorMessage(),
 *     which translates the HTTP status code into a Vietnamese message.
 *     Raw err.message from the backend is NEVER shown to the user.
 */

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { fetchSubjects, createDocument } from "@/apis/document.api";
import { UPLOAD_ERROR_MESSAGES } from "@/constants/upload.const";
import { getErrorMessage } from "@/utils/error";
import type { Subject } from "@/types/document.type";
import {
  buildCloudinaryUploadResult,
  type CloudinaryUploadResult,
} from "../utils/cloudinary-upload-result";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "ddxstobvd";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

/**
 * Uploads a file to Cloudinary using the unsigned preset.
 * Throws a generic Error on failure — the caller maps it to
 * UPLOAD_ERROR_MESSAGES.CLOUDINARY_UPLOAD_FAILED for the user
 * and logs the raw response body for debugging.
 */
async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    const body = await res.text();
    // Logged for debugging only — never surfaced to the user.
    throw new Error(`Cloudinary upload failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return buildCloudinaryUploadResult(data, file);
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  /** File selected in FileUploadBox, managed by the parent. */
  selectedFile: File | null;
  /** Lift the submitting state up so FileUploadBox can disable itself. */
  onSubmittingChange: (isSubmitting: boolean) => void;
  /** Called after the document is saved successfully. */
  onSuccess: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DocumentUploadForm({
  selectedFile,
  onSubmittingChange,
  onSuccess,
}: Props): React.JSX.Element {
  // Form values
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [description, setDescription] = useState("");

  // Visibility toggle — replaces the two-button draft/publish pattern
  const [isPublic, setIsPublic] = useState(false);

  // Subjects from API
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  useEffect(() => {
    fetchSubjects(100)
      .then((res) => setSubjects(res.subjects))
      .catch((err) => {
        // Non-critical — dropdown degrades gracefully to empty.
        console.error("fetchSubjects failed:", err);
      })
      .finally(() => setSubjectsLoading(false));
  }, []);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Submit handler ────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    // Client-side guards
    if (!selectedFile) {
      setSubmitError(UPLOAD_ERROR_MESSAGES.MISSING_FILE);
      return;
    }
    if (!title.trim()) {
      setSubmitError(UPLOAD_ERROR_MESSAGES.MISSING_TITLE);
      return;
    }
    if (!UPLOAD_PRESET) {
      setSubmitError(UPLOAD_ERROR_MESSAGES.MISSING_UPLOAD_CONFIG);
      return;
    }

    setIsSubmitting(true);
    onSubmittingChange(true);
    setSubmitError(null);

    // Phase 1 — upload file to Cloudinary
    let cloudResult: CloudinaryUploadResult;
    try {
      cloudResult = await uploadToCloudinary(selectedFile);
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      setSubmitError(UPLOAD_ERROR_MESSAGES.CLOUDINARY_UPLOAD_FAILED);
      setIsSubmitting(false);
      onSubmittingChange(false);
      return;
    }

    // Phase 2 — create document record in the API
    try {
      await createDocument({
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl: cloudResult.url,
        publicId: cloudResult.publicId,
        sizeInBytes: cloudResult.bytes,
        format: cloudResult.format,
        resourceType: cloudResult.resourceType,
        subjectId: subjectId || undefined,
        isPublic,
      });

      // Reset form on success
      setTitle("");
      setSubjectId("");
      setDescription("");
      setIsPublic(false);
      onSuccess();
    } catch (err) {
      // Logged for debugging — the user only sees a mapped message,
      // never the raw backend error.
      console.error("createDocument failed:", err);
      setSubmitError(
        getErrorMessage(err, {
          400: UPLOAD_ERROR_MESSAGES.CREATE_DOCUMENT_FAILED,
          422: UPLOAD_ERROR_MESSAGES.CREATE_DOCUMENT_FAILED,
        }),
      );
    } finally {
      setIsSubmitting(false);
      onSubmittingChange(false);
    }
  }, [
    selectedFile,
    title,
    description,
    subjectId,
    isPublic,
    onSubmittingChange,
    onSuccess,
  ]);

  // ── Render ────────────────────────────────────────────────────────────────

  const canSubmit = Boolean(selectedFile) && !isSubmitting;

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-5" noValidate>
      {/* Title */}
      <InputField
        label="Tên tài liệu"
        placeholder="Ví dụ: Đề cương Giải tích 1 - K65"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        disabled={isSubmitting}
      />

      {/* Subject + School */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Subject — populated from GET /api/v1/subjects */}
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-on-surface-variant">
            Môn học
          </span>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={subjectsLoading || isSubmitting}
            className="
              w-full rounded-xl border border-outline bg-surface
              py-2 pl-3 pr-8 text-sm text-on-surface
              focus:border-2 focus:border-primary focus:outline-none
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            <option value="">Chọn môn học</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        {/*
         * "Trường học" is not part of CreateDocumentDto — the backend
         * derives it from the chosen subject. Shown as read-only context.
         */}
        <InputField
          label="Trường học"
          value="ĐH FPT (mặc định)"
          readOnly
          className="cursor-not-allowed opacity-60"
        />
      </div>

      {/* Description */}
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-on-surface-variant">
          Mô tả chi tiết
        </span>
        <textarea
          placeholder="Tóm tắt nội dung tài liệu để người khác dễ tìm thấy..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          disabled={isSubmitting}
          className="
            w-full resize-none rounded-xl border border-outline bg-surface
            p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60
            focus:border-2 focus:border-primary focus:outline-none
            disabled:cursor-not-allowed disabled:opacity-50
          "
        />
      </label>

      {/* Visibility toggle */}
      <div className="flex items-center justify-between rounded-xl border border-outline bg-surface-variant/40 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-on-surface">
            Công khai tài liệu
          </span>
          <span className="text-xs text-on-surface-variant">
            {isPublic
              ? "Mọi người có thể tìm và xem tài liệu này sau khi được duyệt."
              : "Chỉ mình bạn thấy tài liệu này."}
          </span>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          aria-label="Công khai tài liệu"
          disabled={isSubmitting}
          onClick={() => setIsPublic((prev) => !prev)}
          className={`
            relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
            disabled:cursor-not-allowed disabled:opacity-50
            ${isPublic ? "bg-primary" : "bg-outline"}
          `}
        >
          <span
            className={`
              pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full
              bg-white shadow-sm transition-transform duration-200
              ${isPublic ? "translate-x-5" : "translate-x-0"}
            `}
          />
        </button>
      </div>

      {/* No-file hint */}
      {!selectedFile ? (
        <p className="flex items-center gap-1 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">info</span>
          Chọn tệp bên trái trước, sau đó nhấn lưu.
        </p>
      ) : null}

      {/* Submit error */}
      {submitError ? (
        <div className="flex items-start gap-2 rounded-xl border border-error/40 bg-error-container/30 p-3 text-sm text-error">
          <span className="material-symbols-outlined shrink-0 text-[18px]">
            error
          </span>
          {submitError}
        </div>
      ) : null}

      {/* Action button */}
      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant={isPublic ? "primary" : "outline"}
          className="w-full sm:w-auto"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isSubmitting
            ? isPublic
              ? "Đang tải lên..."
              : "Đang lưu..."
            : isPublic
              ? "Công khai tài liệu"
              : "Chỉ mình tôi"}
        </Button>
      </div>
    </form>
  );
}
