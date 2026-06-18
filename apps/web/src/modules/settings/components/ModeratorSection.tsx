"use client";

import { Card } from "@/components/ui/Card";

const PLACEHOLDER_PREFERENCES = [
  {
    label: "Xét duyệt tự động",
    description: "Áp dụng quy tắc kiểm duyệt tự động cho tài liệu mới",
  },
  {
    label: "Thông báo tài liệu chờ duyệt",
    description: "Nhận thông báo khi có tài liệu cần kiểm duyệt",
  },
] as const;

export function ModeratorSection(): React.JSX.Element {
  return (
    <Card className="p-6 shadow-sm shadow-black/5 lg:p-8">
      {/* Section header */}
      <div className="mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary">rule</span>
        <div>
          <h2 className="text-lg font-bold text-on-surface">
            Tùy chọn kiểm duyệt
          </h2>
          <p className="text-sm text-on-surface-variant">
            Cấu hình quy trình và tiêu chí kiểm duyệt tài liệu.
          </p>
        </div>
      </div>

      {/* Coming soon notice */}
      <div className="mb-4 rounded-xl border border-outline-variant bg-surface-container-low p-6 text-center">
        <span className="material-symbols-outlined mb-3 text-[48px] text-on-surface-variant opacity-40">
          construction
        </span>
        <p className="font-label-md text-label-md text-on-surface-variant">
          Tính năng đang được phát triển
        </p>
        <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant opacity-70">
          Tùy chọn kiểm duyệt sẽ có mặt trong phiên bản sắp tới.
        </p>
      </div>

      {/* Placeholder preference rows */}
      <div className="grid gap-3 sm:grid-cols-2">
        {PLACEHOLDER_PREFERENCES.map(({ label, description }) => (
          <div
            key={label}
            className="flex cursor-not-allowed items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface p-4 opacity-50"
          >
            <div>
              <p className="font-label-md text-label-md tracking-normal">
                {label}
              </p>
              <p className="font-label-sm text-label-sm tracking-normal text-on-surface-variant">
                {description}
              </p>
            </div>
            {/* Disabled toggle placeholder */}
            <div className="h-5 w-10 rounded-full bg-outline-variant" />
          </div>
        ))}
      </div>
    </Card>
  );
}
