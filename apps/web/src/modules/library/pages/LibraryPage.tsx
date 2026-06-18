"use client";

import { useEffect, useMemo } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { useLibraryStore } from "../store/useLibraryStore";
import { FilterBar } from "../components/FilterBar";
import { LibraryHeader } from "../components/LibraryHeader";
import { DocumentGrid } from "../components/DocumentGrid";

/**
 * LibraryPage — main entry point for /library.
 *
 * Responsibilities:
 *  - Bootstrap the store (fetch documents + subjects on mount)
 *  - Compute the client-side filtered document list (search by title)
 *  - Compose FilterBar + LibraryHeader + DocumentGrid + Pagination
 */
export default function LibraryPage(): React.JSX.Element {
  const {
    documents,
    subjects,
    pagination,
    isLoading,
    error,
    filters,
    fetchDocuments: loadDocuments,
    fetchSubjects: loadSubjects,
    setPage,
  } = useLibraryStore();

  /** Bootstrap data on first render */
  useEffect(() => {
    loadDocuments();
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Client-side search filter — applied on top of the server page.
   * Matching is case-insensitive and trims whitespace.
   */
  const visibleDocuments = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter((doc) => doc.title.toLowerCase().includes(term));
  }, [documents, filters.search]);

  /** Resolve the active subject label for the header */
  const activeSubjectName = useMemo(() => {
    if (!filters.subjectId) return null;
    return subjects.find((s) => s.id === filters.subjectId)?.name ?? null;
  }, [filters.subjectId, subjects]);

  /**
   * Fixed viewport layout — nothing scrolls at page level.
   *
   * Height budget: UserShell <main> has py-6 top + py-6 bottom = 3rem total.
   * The outer container claims exactly that remaining height with flex-col so
   * LibraryHeader (shrink-0) and the two-column row (flex-1 min-h-0) together
   * never exceed the viewport.
   *
   *  ┌─────────────────────────────────────────┐  ← h-[calc(100vh-3rem)]
   *  │ LibraryHeader          shrink-0          │
   *  ├────────────┬────────────────────────────┤  ← flex-1 min-h-0
   *  │ FilterBar  │  DocumentGrid              │
   *  │ overflow-y │  overflow-hidden (fixed)   │
   *  │ -auto      │  ──────────────────────────│
   *  │ (scrolls   │  Pagination  shrink-0      │
   *  │  only when │                            │
   *  │  needed)   │                            │
   *  └────────────┴────────────────────────────┘
   */
  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-6 overflow-hidden">
      {/* Header — takes its natural height, never shrinks away */}
      <LibraryHeader
        pagination={pagination}
        activeSearch={filters.search}
        activeSubjectName={activeSubjectName}
        isLoading={isLoading}
      />

      {/* Two-column row — fills all remaining height */}
      <div className="flex flex-1 min-h-0 gap-6 overflow-hidden">
        {/* Left: FilterBar scrolls independently when subjects overflow */}
        <FilterBar />

        {/* Right: fixed column — grid is clipped, pagination stays anchored */}
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <DocumentGrid
              documents={visibleDocuments}
              isLoading={isLoading}
              error={error}
            />
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="shrink-0 mt-4 flex items-center justify-between border-t border-outline-variant/40 pt-4">
              <p className="text-sm text-on-surface-variant">
                Trang {pagination.page} / {pagination.totalPages} —{" "}
                {pagination.total.toLocaleString("vi-VN")} tài liệu
              </p>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
