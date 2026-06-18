"use client";

import { useMemo } from "react";
import type { FC } from "react";

export interface PaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
}

export const Pagination: FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const pages = useMemo(() => {
    const delta = 1;
    const range: number[] = [];

    for (let page = 1; page <= safeTotalPages; page += 1) {
      if (
        page === 1 ||
        page === safeTotalPages ||
        (page >= safeCurrentPage - delta && page <= safeCurrentPage + delta)
      ) {
        range.push(page);
      }
    }

    return Array.from(new Set(range));
  }, [safeCurrentPage, safeTotalPages]);

  const goToPage = (page: number) => {
    onPageChange(Math.min(Math.max(1, page), safeTotalPages));
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => goToPage(safeCurrentPage - 1)}
        className="material-symbols-outlined rounded-md border border-outline-variant px-2 py-1 text-sm hover:bg-surface-variant disabled:opacity-50"
        disabled={safeCurrentPage === 1}
      >
        chevron_left
      </button>
      {pages.map((page, index) => {
        const previousPage = pages[index - 1];

        return (
          <div key={page} className="flex items-center gap-1">
            {previousPage && page - previousPage > 1 ? (
              <span className="px-2 text-on-surface-variant">...</span>
            ) : null}
            <button
              type="button"
              onClick={() => goToPage(page)}
              className={`rounded-md border px-3 py-1 font-medium ${
                page === safeCurrentPage
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline-variant hover:bg-surface-variant"
              }`}
              aria-current={page === safeCurrentPage ? "page" : undefined}
            >
              {page}
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => goToPage(safeCurrentPage + 1)}
        className="material-symbols-outlined rounded-md border border-outline-variant px-2 py-1 text-sm hover:bg-surface-variant disabled:opacity-50"
        disabled={safeCurrentPage === safeTotalPages}
      >
        chevron_right
      </button>
    </div>
  );
};
