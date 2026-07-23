"use client";

import { useEffect, useMemo } from "react";

import { Pagination } from "@/components/ui/Pagination";
import { useLibraryDocuments } from "../hooks/use-library-documents";
import { useSubjects } from "../hooks/use-subjects";
import { useLibraryFiltersStore } from "../store/library-filters.store";
import { DocumentGrid } from "../components/library/DocumentGrid";
import { FilterToolbar } from "../components/library/FilterToolbar";

/**
 * FLOW DOC: apps/web/docs/FRONTEND-CODE-FLOW-VI.md#flow-documents
 * Page coordinator của /library: đọc filter client state, gọi query hooks và
 * truyền server data xuống toolbar/grid/pagination để render.
 */

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
  const filters = useLibraryFiltersStore((state) => state.filters);
  const setPage = useLibraryFiltersStore((state) => state.setPage);
  const setSubjectId = useLibraryFiltersStore((state) => state.setSubjectId);

  useEffect(() => {
    const subjectId = new URLSearchParams(window.location.search).get(
      "subjectId",
    );

    if (subjectId) {
      setSubjectId(subjectId);
    }
  }, [setSubjectId]);

  const documentsQuery = useLibraryDocuments({
    page: filters.page,
    limit: 12,
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
  });
  const subjectsQuery = useSubjects();
  const documents = documentsQuery.data?.documents ?? [];
  const pagination = documentsQuery.data?.pagination ?? null;
  const error = documentsQuery.isError
    ? "Không thể tải danh sách tài liệu. Vui lòng thử lại."
    : null;

  /** Client-side format filter + sort */
  const visibleDocuments = useMemo(() => {
    let docs = documents;

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
  }, [documents, filters.format, filters.sortBy]);

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-6 overflow-hidden">
      {/* Horizontal filter toolbar */}
      <div className="shrink-0">
        <FilterToolbar
          pagination={pagination}
          isLoading={documentsQuery.isLoading}
          subjects={subjectsQuery.data?.subjects ?? []}
          isLoadingSubjects={subjectsQuery.isLoading}
        />
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
          isLoading={documentsQuery.isLoading}
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
