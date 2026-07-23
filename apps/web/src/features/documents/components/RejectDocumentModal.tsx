"use client";

import { useEffect, useState } from "react";

const REASON_OPTIONS = [
  "Nội dung trùng lặp",
  "Sai định dạng / file lỗi",
  "Vi phạm bản quyền",
  "Nội dung không phù hợp",
  "Khác",
] as const;

type ReasonOption = (typeof REASON_OPTIONS)[number];

interface Props {
  readonly open: boolean;
  readonly title?: string;
  readonly onCancel: () => void;
  readonly onConfirm: (rejectionReason: string) => Promise<void>;
  readonly isSubmitting?: boolean;
}

export function RejectDocumentModal({
  open,
  title = "Từ chối tài liệu",
  onCancel,
  onConfirm,
  isSubmitting = false,
}: Props): React.JSX.Element | null {
  const [selectedReason, setSelectedReason] = useState<ReasonOption | "">("");
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedReason("");
      setCustomReason("");
    }
  }, [open]);

  if (!open) return null;

  const isOther = selectedReason === "Khác";
  const canSubmit =
    selectedReason !== "" &&
    (!isOther || customReason.trim().length > 0) &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!selectedReason) return;

    const rejectionReason = isOther ? customReason.trim() : selectedReason;

    if (!rejectionReason) return;

    await onConfirm(rejectionReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        aria-label="Đóng modal từ chối tài liệu"
        className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm"
        onClick={onCancel}
        type="button"
      />

      <form
        className="relative z-10 w-full max-w-lg rounded-2xl border border-outline-variant bg-surface p-6 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-on-surface">{title}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Chọn một lý do có sẵn hoặc nhập lý do tự do nếu phù hợp hơn.
            </p>
          </div>

          <button
            className="rounded-lg px-2 py-1 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-variant"
            onClick={onCancel}
            type="button"
          >
            Đóng
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-on-surface">
              Lý do từ chối
            </span>
            <select
              className="w-full rounded-xl border border-outline bg-surface px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
              disabled={isSubmitting}
              value={selectedReason}
              onChange={(event) => {
                setSelectedReason(event.target.value as ReasonOption | "");
                if (event.target.value !== "Khác") {
                  setCustomReason("");
                }
              }}
            >
              <option value="">Chọn lý do</option>
              {REASON_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {isOther ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-on-surface">
                Lý do chi tiết
              </span>
              <textarea
                className="min-h-28 w-full rounded-xl border border-outline bg-surface px-3 py-2 text-sm leading-6 text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                onChange={(event) => setCustomReason(event.target.value)}
                placeholder="Mô tả cụ thể lý do từ chối, gợi ý nội dung cần sửa hoặc bổ sung."
                rows={5}
                value={customReason}
              />
            </label>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            Hủy
          </button>
          <button
            className="rounded-xl bg-error px-4 py-2 text-sm font-medium text-on-error transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
            type="submit"
          >
            {isSubmitting ? "Đang từ chối..." : "Xác nhận từ chối"}
          </button>
        </div>
      </form>
    </div>
  );
}
