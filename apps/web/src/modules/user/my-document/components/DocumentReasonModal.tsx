"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { LibraryDocument } from "@/types/document.type";
import { formatDate } from "@/utils";

interface Props {
  readonly document: LibraryDocument | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function DocumentReasonModal({
  document,
  isOpen,
  onClose,
}: Props): React.JSX.Element | null {
  if (!isOpen || !document) return null;

  const rejectionReason = document.rejectionReason?.trim() || "Chưa có lý do.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-reason-title"
    >
      <button
        aria-label="Đóng hộp thoại lý do từ chối"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-2xl shadow-black/10">
        <div className="border-b border-outline-variant bg-surface-container-low px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center rounded-full bg-error/10 px-3 py-1 text-xs font-medium text-error">
                Bị từ chối
              </p>
              <h3
                id="document-reason-title"
                className="text-lg font-bold text-on-surface"
              >
                Lý do từ chối
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Xem lại phản hồi của moderator để biết cần sửa nội dung nào.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-2 text-on-surface-variant"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        </div>

        <div className="space-y-4 p-6 text-sm">
          <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-low px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
              Tên tài liệu
            </p>
            <p className="mt-1 font-semibold text-on-surface">
              {document.title}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-low px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                Ngày tải lên
              </p>
              <p className="mt-1 text-on-surface">
                {formatDate(document.createdAt)}
              </p>
            </div>

            <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-low px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                Trạng thái
              </p>
              <p className="mt-1 text-on-surface">
                <Badge tone="error">Bị từ chối</Badge>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-error/15 bg-error/5 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-error">
              Lý do từ chối
            </p>
            <p className="mt-2 font-medium text-on-surface">
              {rejectionReason}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
