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
 * Pure presentational component; no store dependency.
 */
export const LibraryHeader: FC<LibraryHeaderProps> = ({
  pagination,
  activeSearch,
  activeSubjectName,
  isLoading,
}) => {
  const hasFilter = Boolean(activeSearch || activeSubjectName);

  const headline = activeSearch
    ? `Kết quả cho "${activeSearch}"`
    : activeSubjectName
      ? `Tài liệu môn "${activeSubjectName}"`
      : "Thư viện tài liệu";

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-on-surface">{headline}</h1>

      {isLoading ? (
        <div className="mt-1 h-4 w-48 animate-pulse rounded bg-surface-variant" />
      ) : (
        <p className="mt-1 text-sm text-on-surface-variant">
          {pagination
            ? `Tìm thấy ${pagination.total.toLocaleString("vi-VN")} tài liệu liên quan`
            : "Đang tải dữ liệu…"}
          {hasFilter ? (
            <span className="ml-1 text-primary">
              {activeSubjectName ? `· ${activeSubjectName}` : ""}
            </span>
          ) : null}
        </p>
      )}
    </div>
  );
};
