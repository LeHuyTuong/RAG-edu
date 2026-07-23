"use client";

/**
 * DocumentTable
 *
 * Renders the searchable, paginated list of the user's documents.
 * Uses only components/ui primitives: Card, Badge, Button, Table, Pagination,
 * InputField.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InputField } from "@/components/ui/InputField";
import { Pagination } from "@/components/ui/Pagination";
import { SelectField } from "@/components/ui/SelectField";
import { Table, type TableRow } from "@/components/ui/Table";
import type { StatusTone } from "@/types";

/** Badge only supports status tones, not semantic UI tones. */
type BadgeStatusTone = Extract<
  StatusTone,
  "success" | "warning" | "error" | "neutral"
>;

import { formatDate } from "@/utils";
import { getDisplayFromStatus } from "@/shared/documentStatus";
import type { LibraryDocument, PaginationMeta } from "@/types/document.type";

const COLUMNS = [
  { key: "name", label: "Tên tài liệu" },
  { key: "date", label: "Ngày tải lên", align: "center" as const },
  { key: "status", label: "Trạng thái", align: "center" as const },
  { key: "actions", label: "Thao tác", align: "center" as const },
] as const;

// Hiển thị trạng thái theo state machine thật (ragStatus). Fallback về chuỗi
// `status` collapsed nếu response chưa có ragStatus.
function getStatusDisplay(doc: LibraryDocument): {
  label: string;
  tone: BadgeStatusTone;
} {
  return getDisplayFromStatus(doc.status, doc.ragStatus, doc.isPublic);
}

function formatToIcon(publicId: string): string {
  const lower = publicId.toLowerCase();
  if (lower.includes("pdf")) return "picture_as_pdf";
  if (lower.includes("docx") || lower.includes("doc")) return "description";
  if (lower.includes("pptx") || lower.includes("ppt")) return "slideshow";
  return "draft";
}

function SkeletonRows({ count }: { count: number }): React.JSX.Element {
  return (
    <div className="divide-y divide-outline-variant">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 animate-pulse"
        >
          <div className="h-10 w-10 rounded-lg bg-surface-variant" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-1/2 rounded bg-surface-variant" />
            <div className="h-3 w-1/4 rounded bg-surface-variant" />
          </div>
        </div>
      ))}
    </div>
  );
}

const STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: "ALL" },
  { label: "Đang tải lên", value: "UPLOADING" },
  { label: "Đang kiểm duyệt", value: "REVIEWING" },
  { label: "Chờ duyệt", value: "PENDING_REVIEW" },
  { label: "Đang index", value: "INDEXING" },
  { label: "Đang index lại", value: "REINDEXING" },
  { label: "Hoàn tất (READY)", value: "READY" },
  { label: "Index lỗi", value: "FAILED" },
  { label: "Bị từ chối", value: "REJECTED" },
  { label: "Đã xóa", value: "SOFT_DELETED" },
];

const SORT_OPTIONS = [
  { label: "Mới nhất", value: "NEWEST" },
  { label: "Cũ nhất", value: "OLDEST" },
  { label: "Tên A-Z", value: "NAME_ASC" },
  { label: "Tên Z-A", value: "NAME_DESC" },
];

interface Props {
  readonly documents: LibraryDocument[];
  readonly pagination: PaginationMeta | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly skeletonCount: number;
  readonly onPageChange: (page: number) => void;
  readonly onView: (document: LibraryDocument) => void;
  readonly onEdit: (document: LibraryDocument) => void;
  readonly onDeleteDirect: (document: LibraryDocument) => void;
  readonly onRestore?: (document: LibraryDocument) => void;
  readonly filterStatus?: string;
  readonly onStatusChange?: (status: string) => void;
  readonly deletingId: string | null;
  readonly savingId: string | null;
}

export function DocumentTable({
  documents,
  pagination,
  isLoading,
  error,
  skeletonCount,
  onPageChange,
  onEdit,
  onDeleteDirect,
  onRestore,
  onStatusChange,
  deletingId,
  savingId,
}: Props): React.JSX.Element {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortOption, setSortOption] = useState("NEWEST");
  const normalizedSearchTerm = searchTerm.trim();
  const isSearching = normalizedSearchTerm.length > 0 || filterStatus !== "ALL";

  const visibleDocuments = useMemo(() => {
    let filtered = documents;

    const term = normalizedSearchTerm.toLowerCase();
    if (term) {
      filtered = filtered.filter(
        (document) =>
          document.title.toLowerCase().includes(term) ||
          (document.subject?.name.toLowerCase().includes(term) ?? false),
      );
    }

    if (filterStatus !== "ALL") {
      filtered = filtered.filter(
        (doc) =>
          doc.ragStatus === filterStatus ||
          (!doc.ragStatus && filterStatus === doc.status),
      );
    }

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortOption === "NEWEST") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortOption === "OLDEST") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else if (sortOption === "NAME_ASC") {
        return a.title.localeCompare(b.title);
      } else if (sortOption === "NAME_DESC") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    return sorted;
  }, [documents, normalizedSearchTerm, filterStatus, sortOption]);

  const tableRows: TableRow[] = visibleDocuments.map((doc) => {
    const status = getStatusDisplay(doc);
    const icon = formatToIcon(doc.publicId);

    return {
      id: doc.id,
      cells: [
        <div key="name" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-primary/10 text-primary shadow-sm shadow-primary/5">
            <span className="material-symbols-outlined text-[18px]">
              {icon}
            </span>
          </div>
          <div>
            <p className="font-semibold text-on-surface line-clamp-1">
              {doc.title}
            </p>
            <p className="text-xs text-on-surface-variant">
              {doc.subject?.name ?? "Chưa phân loại"}
            </p>
          </div>
        </div>,
        <span
          key="date"
          className="block text-center whitespace-nowrap text-sm text-on-surface-variant"
        >
          {formatDate(doc.createdAt)}
        </span>,
        <div key="status" className="flex justify-center">
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>,
        <div key="actions" className="flex justify-center gap-1">
          {doc.ragStatus === "SOFT_DELETED" ? (
            <>
              <Button
                aria-label={`Khôi phục ${doc.title}`}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                onClick={() => onRestore?.(doc)}
                disabled={savingId === doc.id || deletingId === doc.id}
                title={`Khôi phục ${doc.title}`}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[20px]"
                >
                  restore_from_trash
                </span>
              </Button>
              <Button
                aria-label={`Xóa vĩnh viễn ${doc.title}`}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-on-surface-variant hover:bg-surface-container-high hover:text-error"
                onClick={() => onDeleteDirect(doc)}
                disabled={savingId === doc.id || deletingId === doc.id}
                title={`Xóa vĩnh viễn ${doc.title}`}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[20px]"
                >
                  delete_forever
                </span>
              </Button>
            </>
          ) : (
            <>
              <Button
                aria-label={`Chỉnh sửa ${doc.title}`}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                onClick={() => onEdit(doc)}
                disabled={savingId === doc.id || deletingId === doc.id}
                title={`Chỉnh sửa ${doc.title}`}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[20px]"
                >
                  {savingId === doc.id || deletingId === doc.id
                    ? "sync"
                    : "edit"}
                </span>
              </Button>
              <Button
                aria-label={`Xem trước ${doc.title}`}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                onClick={() => router.push(`/documents/${doc.id}`)}
                disabled={savingId === doc.id || deletingId === doc.id}
                title={`Xem trước ${doc.title}`}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[20px]"
                >
                  visibility
                </span>
              </Button>
              <Button
                aria-label={`Xóa ${doc.title}`}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-on-surface-variant hover:bg-surface-container-high hover:text-error"
                onClick={() => onDeleteDirect(doc)}
                disabled={savingId === doc.id || deletingId === doc.id}
                title={`Xóa ${doc.title}`}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[20px]"
                >
                  delete
                </span>
              </Button>
            </>
          )}
        </div>,
      ],
    };
  });

  return (
    <Card className="p-5 shadow-sm shadow-black/5 lg:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-on-surface">
            Danh sách tài liệu
          </h2>
          {isSearching ? (
            <p className="text-xs text-on-surface-variant">
              {visibleDocuments.length} tài liệu trên trang này
            </p>
          ) : pagination ? (
            <p className="text-xs text-on-surface-variant">
              {visibleDocuments.length} / {pagination.total} tài liệu
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full lg:w-64">
            <InputField
              placeholder="Tìm kiếm tài liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={
                <span className="material-symbols-outlined text-[18px]">
                  search
                </span>
              }
            />
          </div>
          <div className="w-48">
            <SelectField
              options={STATUS_OPTIONS}
              value={filterStatus}
              onChange={(v) => {
                setFilterStatus(v);
                onStatusChange?.(v);
              }}
            />
          </div>
          <div className="w-36">
            <SelectField
              options={SORT_OPTIONS}
              value={sortOption}
              onChange={setSortOption}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest">
        {isLoading ? (
          <SkeletonRows count={skeletonCount} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <span className="material-symbols-outlined mb-2 text-4xl text-error">
              error_outline
            </span>
            <p className="text-sm text-error">{error}</p>
          </div>
        ) : tableRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <span className="material-symbols-outlined mb-2 text-4xl text-on-surface-variant/40">
              folder_open
            </span>
            <p className="text-sm text-on-surface-variant">
              {searchTerm
                ? "Không tìm thấy kết quả phù hợp."
                : "Bạn chưa có tài liệu nào."}
            </p>
          </div>
        ) : (
          <Table
            columns={COLUMNS}
            rows={tableRows}
            onRowDoubleClick={(row) => {
              router.push(`/documents/${row.id}`);
            }}
          />
        )}
      </div>

      {pagination && pagination.totalPages > 1 && !isLoading && !isSearching ? (
        <div className="mt-5 flex flex-col gap-3 border-t border-outline-variant pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-on-surface-variant">
            Hiển thị {visibleDocuments.length} trong tổng số {pagination.total}{" "}
            tài liệu
          </p>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      ) : null}
    </Card>
  );
}
