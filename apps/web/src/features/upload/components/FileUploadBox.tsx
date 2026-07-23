"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import type { UploadConfig } from "@/types/upload";
import { formatFileSize } from "@/utils";
import { validateFile } from "@/utils/validate.file";

interface Props {
  readonly config: UploadConfig;
  readonly selectedFile: File | null;
  readonly onFileChange: (file: File | null) => void;
  readonly isSubmitting?: boolean;
}

export default function FileUploadBox({
  config,
  selectedFile,
  onFileChange,
  isSubmitting = false,
}: Props): React.JSX.Element {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const accept = [...config.allowedExtensions, ...config.allowedMimeTypes].join(
    ",",
  );
  const supportedFormats = config.allowedExtensions
    .map((extension) => extension.slice(1).toUpperCase())
    .join(", ");
  const maxSizeMb = Math.round(config.maxFileSize / 1024 / 1024);

  const handleFile = useCallback(
    (file: File) => {
      const result = validateFile(file, config);
      if (!result.valid) {
        setValidationError(result.error ?? "Tệp không hợp lệ.");
        toast.error(result.error ?? "Chỉ nhận tài liệu!");
        onFileChange(null);
        return;
      }

      setValidationError(null);
      onFileChange(file);
    },
    [config, onFileChange],
  );

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
    event.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div
        className={
          "\n          relative flex min-h-52 flex-col items-center justify-center\n          rounded-2xl border-2 border-dashed p-8 text-center transition-colors\n          " +
          (isSubmitting ? "cursor-not-allowed opacity-60" : "") +
          " " +
          (isDragging
            ? "border-primary bg-primary/5"
            : selectedFile
              ? "border-primary/60 bg-primary/5"
              : "border-outline-variant hover:border-primary/60 hover:bg-surface-container-low")
        }
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isSubmitting) setIsDragging(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!isSubmitting && event.dataTransfer.files?.[0]) {
            handleFile(event.dataTransfer.files[0]);
          }
        }}
      >
        {selectedFile ? (
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
          <label
            className={
              "cursor-pointer space-y-2 " +
              (isSubmitting ? "pointer-events-none" : "")
            }
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
              Hỗ trợ {supportedFormats || "tài liệu"} (Max {maxSizeMb}MB)
            </p>
            <input
              accept={accept}
              className="sr-only"
              disabled={isSubmitting}
              onChange={onInputChange}
              type="file"
            />
          </label>
        )}
      </div>

      {validationError ? (
        <p className="flex items-center gap-1 text-sm text-error">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {validationError}
        </p>
      ) : null}

      {selectedFile ? (
        <button
          className="
            flex w-fit items-center justify-center gap-1 rounded-xl
            border border-error/40 py-2 text-sm text-error
            transition-colors hover:bg-error-container/30
            disabled:cursor-not-allowed disabled:opacity-50 p-4 px-5 ml-auto
          "
          disabled={isSubmitting}
          onClick={() => {
            setValidationError(null);
            onFileChange(null);
          }}
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
          Xóa file đã chọn
        </button>
      ) : null}

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
