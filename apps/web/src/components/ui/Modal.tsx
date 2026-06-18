"use client";

import type { FC, ReactNode } from "react";

export interface ModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly description: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly children?: ReactNode;
}

export const Modal: FC<ModalProps> = ({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  confirmLabel = "Xóa",
  cancelLabel = "Hủy",
  children,
}) => {
  if (!open) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="absolute inset-0 bg-inverse-surface/20 backdrop-blur-sm" />
      <div className="relative z-10 w-[320px] rounded-2xl border border-outline-variant bg-surface p-6 shadow-lg">
        <h4 className="mb-2 font-headline-md text-lg font-bold">{title}</h4>
        <p className="mb-6 text-sm text-on-surface-variant">{description}</p>
        {children}
        <div className="flex justify-end gap-3">
          <button
            className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-variant"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="rounded-xl bg-error px-4 py-2 text-sm font-medium text-on-error transition-opacity hover:opacity-90"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
