"use client";

import { Button } from "@/components/ui/Button";

interface Props {
  readonly documentTitle: string;
  readonly isOpen: boolean;
  readonly isDeleting: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function DeleteDocumentModal({
  documentTitle,
  isOpen,
  isDeleting,
  onCancel,
  onConfirm,
}: Props): React.JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        aria-label="Đóng hộp thoại xóa tài liệu"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onCancel}
        type="button"
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-2xl shadow-black/15">
        <div className="border-b border-outline-variant bg-surface-container-low px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error/10 text-error">
              <span className="material-symbols-outlined text-[20px]">
                delete_forever
              </span>
            </span>
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                Xóa tài liệu?
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Bạn sắp xóa vĩnh viễn tài liệu{" "}
                <span className="font-semibold text-on-surface">
                  {documentTitle}
                </span>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-error/15 bg-error/5 px-4 py-3 text-sm text-on-surface-variant">
            Thao tác này không thể hoàn tác. Tài liệu sẽ bị xóa khỏi danh sách
            của bạn.
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={onCancel}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={onConfirm}
            >
              {isDeleting ? "Đang xóa..." : "Xóa tài liệu"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
