"use client";

import { useEffect, useMemo } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { useLibraryStore } from "../store/useLibraryStore";
import { FilterToolbar } from "../components/FilterToolbar";
import { DocumentGrid } from "../components/DocumentGrid";

/**
 * LibraryPage — main entry point for /library.
 *
 * Full-width layout with horizontal filter toolbar above the document grid.
 *
 *  ┌────────────────────────────────────────┐  ← h-[calc(100vh-3rem)]
 *  │ FilterToolbar  (search, pills, sort)    │
 *  ├────────────────────────────────────────┤
 *  │ DocumentGrid (full width, scrollable)   │
 *  │                                        │
 *  ├────────────────────────────────────────┤
 *  │ Pagination                              │
 *  └────────────────────────────────────────┘
 */
export default function LibraryPage(): React.JSX.Element {
  const {
    documents,
    pagination,
    isLoading,
    error,
    filters,
    fetchDocuments: loadDocuments,
    fetchSubjects: loadSubjects,
    setPage,
  } = useLibraryStore();

  useEffect(() => {
    loadDocuments();
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Client-side search + format filter + sort */
  const visibleDocuments = useMemo(() => {
    let docs = documents;

    const term = filters.search.trim().toLowerCase();
    if (term) {
      docs = docs.filter((doc) => doc.title.toLowerCase().includes(term));
    }

    if (filters.format) {
      docs = docs.filter((doc) => doc.format?.toLowerCase() === filters.format);
    }

    switch (filters.sortBy) {
      case "oldest":
        docs = [...docs].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case "name":
        docs = [...docs].sort((a, b) => a.title.localeCompare(b.title, "vi"));
        break;
      case "newest":
      default:
        docs = [...docs].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
    }

    return docs;
  }, [documents, filters.search, filters.format, filters.sortBy]);

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-6 overflow-hidden">
      {/* Horizontal filter toolbar */}
      <div className="shrink-0">
        <FilterToolbar pagination={pagination} isLoading={isLoading} />
      </div>

      {/* Document grid — full width, scrollable */}
      <div
        className="flex-1 min-h-0 overflow-y-auto
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-outline-variant/40
        [&::-webkit-scrollbar-track]:bg-transparent"
      >
        <DocumentGrid
          documents={visibleDocuments}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="shrink-0 flex items-center justify-between border-t border-outline-variant/40 pt-4">
          <p className="text-sm text-on-surface-variant/60">
            Trang {pagination.page} / {pagination.totalPages} —{" "}
            {pagination.total.toLocaleString("vi-VN")} tư liệu
          </p>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      ) : null}
    </div>
  );
}
