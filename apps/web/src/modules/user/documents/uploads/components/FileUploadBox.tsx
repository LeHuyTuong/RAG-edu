"use client";

/**
 * FileUploadBox
 *
 * Pure file-selection component — no network calls happen here.
 * The file is held in the parent (UploadPage) and passed to
 * DocumentUploadForm, which triggers the Cloudinary upload + API call
 * together when the user clicks "Công khai tài liệu" or "Riêng tư".
 *
 * Responsibilities:
 *  - Render the drag-and-drop / click-to-browse zone
 *  - Validate the selected file against the config rules
 *  - Notify the parent via onFileChange so it can update shared state
 *  - Show the selected file name and a remove button
 */

import { useState, useCallback } from "react";
import { validateFile } from "@/utils/validate.file";
import { formatFileSize } from "@/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CloudinaryConfig {
  maxFiles: number;
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

interface Props {
  config: CloudinaryConfig;
  /** Currently selected file managed by the parent. */
  selectedFile: File | null;
  /** Called when the user picks or removes a file. */
  onFileChange: (file: File | null) => void;
  /** Disables all interactions while the parent is submitting. */
  isSubmitting?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FileUploadBox({
  config,
  selectedFile,
  onFileChange,
  isSubmitting = false,
}: Props): React.JSX.Element {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  /** Validates and forwards the file to the parent. */
  const handleFile = useCallback(
    (file: File) => {
      const result = validateFile(file, config);
      if (!result.valid) {
        setValidationError(result.error ?? "Tệp không hợp lệ.");
        onFileChange(null);
        return;
      }
      setValidationError(null);
      onFileChange(file);
    },
    [config, onFileChange],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // allow re-selecting the same file
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isSubmitting) setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isSubmitting) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const removeFile = () => {
    setValidationError(null);
    onFileChange(null);
  };

  return (
    <div className="space-y-4">
      {/* ── Drop / click zone ── */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative flex min-h-52 flex-col items-center justify-center
          rounded-2xl border-2 border-dashed p-8 text-center transition-colors
          ${isSubmitting ? "cursor-not-allowed opacity-60" : ""}
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : selectedFile
                ? "border-primary/60 bg-primary/5"
                : "border-outline-variant hover:border-primary/60 hover:bg-surface-container-low"
          }
        `}
      >
        {selectedFile ? (
          /* ── File selected state ── */
          <>
            <span className="material-symbols-outlined mb-3 text-5xl text-primary">
              check_circle
            </span>
            <p className="font-semibold text-on-surface">{selectedFile.name}</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {formatFileSize(selectedFile.size)}
            </p>
          </>
        ) : (
          /* ── Empty / dragging state ── */
          <label
            className={`cursor-pointer space-y-2 ${isSubmitting ? "pointer-events-none" : ""}`}
          >
            <span className="material-symbols-outlined mx-auto block text-5xl text-primary/60">
              cloud_upload
            </span>
            <p className="font-semibold text-on-surface">
              Kéo thả file vào đây
            </p>
            <p className="text-sm text-primary underline-offset-2 hover:underline">
              Hoặc nhấn để chọn từ máy tính
            </p>
            <p className="text-xs text-on-surface-variant">
              Hỗ trợ PDF, DOCX, PPTX (Max 50MB)
            </p>
            <input
              type="file"
              className="sr-only"
              accept={config.allowedMimeTypes.join(",")}
              onChange={onInputChange}
              disabled={isSubmitting}
            />
          </label>
        )}
      </div>

      {/* Validation error */}
      {validationError ? (
        <p className="flex items-center gap-1 text-sm text-error">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {validationError}
        </p>
      ) : null}

      {/* Remove selected file */}
      {selectedFile ? (
        <button
          type="button"
          onClick={removeFile}
          disabled={isSubmitting}
          className="
            flex w-fit items-center justify-center gap-1 rounded-xl
            border border-error/40 py-2 text-sm text-error
            transition-colors hover:bg-error-container/30
            disabled:cursor-not-allowed disabled:opacity-50 p-4 px-5 ml-auto
          "
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
          Xóa file đã chọn
        </button>
      ) : null}

      {/* Academic integrity notice */}
      <div className="flex gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <span className="material-symbols-outlined shrink-0 text-[20px] text-primary">
          verified_user
        </span>
        <div className="text-sm">
          <p className="font-semibold text-on-surface">
            Quy tắc Liêm chính Học thuật
          </p>
          <p className="mt-1 text-on-surface-variant">
            Bằng cách tải lên, bạn cam kết rằng tài liệu này không vi phạm bản
            quyền và tuân thủ các quy định về liêm chính của nhà trường.
          </p>
        </div>
      </div>
    </div>
  );
}
