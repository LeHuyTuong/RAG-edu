"use client";

/**
 * UploadPage (/uploads)
 *
 * Layout coordinator — owns the shared selectedFile state and wires the
 * two columns together. No form logic, no Cloudinary calls here.
 *
 * Single-step flow:
 *   1. User selects / drops a file in FileUploadBox (left column).
 *   2. User fills the metadata form in DocumentUploadForm (right column).
 *   3. "Công khai" or "Riêng tư" triggers Cloudinary upload + API create
 *      in one loading state — no intermediate "Upload File" button.
 */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import FileUploadBox from "../components/FileUploadBox";
import { DocumentUploadForm } from "../components/DocumentUploadForm";
import { DEFAULT_UPLOAD_CONFIG } from "@/constants/upload.const";

export default function UploadPage(): React.JSX.Element {
  /** File picked by FileUploadBox; passed to DocumentUploadForm for submission. */
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  /**
   * Mirrors DocumentUploadForm's submitting state so FileUploadBox can
   * disable drag-and-drop while the upload is in progress.
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);

  const handleSuccess = () => {
    setSelectedFile(null);
    setIsSuccess(true);
  };

  // ── Success banner ────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-w-0 flex flex-col items-center justify-center py-24 text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-primary">
          task_alt
        </span>
        <h2 className="text-2xl font-bold text-on-surface">
          Tải lên thành công!
        </h2>
        <p className="text-on-surface-variant">
          Tài liệu đang chờ kiểm duyệt (nếu công khai) hoặc đã được lưu riêng
          tư.
        </p>
        <Button
          type="button"
          variant="primary"
          onClick={() => setIsSuccess(false)}
        >
          Tải lên tài liệu khác
        </Button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface">
          Tải lên tài liệu mới
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Chia sẻ kiến thức của bạn với cộng đồng học thuật AcademiShare.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        {/* Left — file selection only (no upload button) */}
        <FileUploadBox
          config={DEFAULT_UPLOAD_CONFIG}
          selectedFile={selectedFile}
          onFileChange={setSelectedFile}
          isSubmitting={isSubmitting}
        />

        {/* Right — metadata form + single-step submit */}
        <DocumentUploadForm
          selectedFile={selectedFile}
          onSubmittingChange={setIsSubmitting}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
