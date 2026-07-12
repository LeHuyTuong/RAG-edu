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
 * Historical periods come from GET /api/v1/subjects (real API, not mock data).
 * Document types are fixed categories suitable for a historical archive.
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
import { SelectField } from "@/components/ui/SelectField";
import { fetchSubjects, createDocument } from "@/apis/document.api";
import { listFolders, type FolderResponse } from "@/apis/folder.api";
import { UPLOAD_ERROR_MESSAGES } from "@/constants/upload.const";
import { getErrorMessage } from "@/utils/error";
import type { Subject } from "@/types/document.type";
import { uploadFileToCloudinary } from "../utils/cloudinary-upload";

// ── History-specific document types ──────────────────────────────────────────

const DOCUMENT_TYPE_OPTIONS = [
  { label: "Chọn loại tài liệu", value: "" },
  { label: "Tư liệu lịch sử", value: "historical_document" },
  { label: "Bài nghiên cứu", value: "research_paper" },
  { label: "Biên niên sử", value: "chronicle" },
  { label: "Sách lịch sử", value: "history_book" },
  { label: "Bản đồ lịch sử", value: "historical_map" },
  { label: "Tài liệu lưu trữ", value: "archival_material" },
];

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
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [originalAuthor, setOriginalAuthor] = useState("");

  // Visibility toggle
  const [isPublic, setIsPublic] = useState(false);

  // Subjects from API (historical periods)
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  // Folders from API
  const [folders, setFolders] = useState<FolderResponse[]>([]);
  const [folderId, setFolderId] = useState("");

  useEffect(() => {
    fetchSubjects(100)
      .then((res) => setSubjects(res.subjects))
      .catch((err) => {
        console.error("fetchSubjects failed:", err);
      })
      .finally(() => setSubjectsLoading(false));

    listFolders()
      .then((data) => setFolders(data))
      .catch(() => {
        // Non-critical — folder toggle hides if empty.
      });
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

    setIsSubmitting(true);
    onSubmittingChange(true);
    setSubmitError(null);

    // Phase 1 — upload file to Cloudinary
    let cloudResult;
    try {
      cloudResult = await uploadFileToCloudinary(selectedFile);
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
        originalAuthor: originalAuthor.trim() || undefined,
        fileUrl: cloudResult.url,
        publicId: cloudResult.publicId,
        sizeInBytes: cloudResult.bytes,
        format: cloudResult.format,
        resourceType: cloudResult.resourceType,
        subjectId: subjectId || undefined,
        isPublic,
        folderId: folderId ? Number(folderId) : undefined,
      });

      // Reset form on success
      setTitle("");
      setSubjectId("");
      setDocumentType("");
      setDescription("");
      setOriginalAuthor("");
      setIsPublic(false);
      setFolderId("");
      onSuccess();
    } catch (err) {
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
    originalAuthor,
    subjectId,
    folderId,
    isPublic,
    onSubmittingChange,
    onSuccess,
  ]);

  // ── Render ────────────────────────────────────────────────────────────────

  const canSubmit = Boolean(selectedFile) && !isSubmitting;
  const subjectOptions = [
    { label: "Chọn giai đoạn lịch sử", value: "" },
    ...subjects.map((subject) => ({
      label: subject.name,
      value: subject.id,
    })),
  ];
  const folderOptions = [
    { label: "Không có thư mục", value: "" },
    ...folders.map((folder) => ({
      label: folder.folderName,
      value: String(folder.id),
    })),
  ];

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-5" noValidate>
      {/* Title */}
      <InputField
        label="Tên tài liệu"
        placeholder="Ví dụ: Chiến dịch Điện Biên Phủ (1954)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        disabled={isSubmitting}
      />

      {/* Historical period + Document type */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          disabled={subjectsLoading || isSubmitting}
          label="Giai đoạn lịch sử"
          onChange={setSubjectId}
          options={subjectOptions}
          placeholder="Chọn giai đoạn lịch sử"
          value={subjectId}
        />

        <SelectField
          disabled={isSubmitting}
          label="Loại tài liệu"
          onChange={setDocumentType}
          options={DOCUMENT_TYPE_OPTIONS}
          placeholder="Chọn loại tài liệu"
          value={documentType}
        />
      </div>

      {/* Description */}
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-on-surface-variant">
          Mô tả chi tiết
        </span>
        <textarea
          placeholder="Mô tả ngắn về nội dung, bối cảnh hoặc sự kiện lịch sử trong tài liệu..."
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

      {/* Original author */}
      <InputField
        label="Tác giả gốc (nếu có)"
        placeholder="Tên người/tổ chức tạo ra nội dung gốc của tài liệu"
        value={originalAuthor}
        onChange={(e) => setOriginalAuthor(e.target.value)}
        disabled={isSubmitting}
        maxLength={255}
      />

      {/* Folder selection */}
      {folders.length > 0 && (
        <SelectField
          disabled={isSubmitting}
          label="Thư mục"
          onChange={setFolderId}
          options={folderOptions}
          placeholder="Không có thư mục"
          value={folderId}
        />
      )}

      {/* Visibility toggle */}
      <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-on-surface">
            Công khai tư liệu
          </span>
          <span className="text-xs text-on-surface-variant">
            {isPublic
              ? "Cộng đồng có thể tìm và tham khảo tư liệu này."
              : "Công khai để cộng đồng có thể tham khảo"}
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
            relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
            disabled:cursor-not-allowed disabled:opacity-50
            ${isPublic ? "bg-primary" : "bg-outline"}
          `}
        >
          <span
            className={`
              pointer-events-none inline-block h-5 w-5 rounded-full
              bg-surface shadow-sm transition-transform duration-200 ease-out
              ${isPublic ? "translate-x-5" : "translate-x-0.5"}
            `}
          />
        </button>
      </div>

      {/* Upload policy notice */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <p className="text-xs font-semibold text-on-surface mb-1">
          Quy tắc lưu trữ tài liệu lịch sử
        </p>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Bằng cách tải lên, bạn xác nhận tài liệu có nguồn gốc rõ ràng và không vi phạm bản quyền.
        </p>
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
          variant="primary"
          className="w-full sm:w-auto"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isSubmitting
            ? "Đang tải lên..."
            : "Lưu tư liệu"}
        </Button>
      </div>
    </form>
  );
}

