import type { FC } from "react";
import type { PaginationMeta } from "@/types/document.type";

interface LibraryHeaderProps {
  pagination: PaginationMeta | null;
  activeSearch: string;
  activeSubjectName: string | null;
  isLoading: boolean;
}

/**
 * LibraryHeader — displays the result count and active filter context.
 */
export const LibraryHeader: FC<LibraryHeaderProps> = ({
  pagination,
  activeSearch,
  activeSubjectName,
  isLoading,
}) => {
  const headline = activeSearch
    ? `Kết quả cho "${activeSearch}"`
    : activeSubjectName
      ? `Tư liệu · ${activeSubjectName}`
      : "Kho tư liệu lịch sử";

  return (
    <div className="flex items-end justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">
          {headline}
        </h1>

        {isLoading ? (
          <div className="mt-1.5 h-4 w-36 animate-pulse rounded bg-surface-variant" />
        ) : (
          <p className="mt-1.5 text-sm text-on-surface-variant/60">
            {pagination
              ? `Hiển thị ${pagination.total.toLocaleString("vi-VN")} tư liệu`
              : "Đang tải dữ liệu…"}
          </p>
        )}
      </div>
    </div>
  );
};
