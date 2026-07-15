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

interface Props {
  readonly documents: LibraryDocument[];
  readonly pagination: PaginationMeta | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly skeletonCount: number;
  readonly onPageChange: (page: number) => void;
  readonly onView: (document: LibraryDocument) => void;
  readonly onEdit: (document: LibraryDocument) => void;
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
  onView,
  onEdit,
  deletingId,
  savingId,
}: Props): React.JSX.Element {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearchTerm = searchTerm.trim();
  const isSearching = normalizedSearchTerm.length > 0;

  const visibleDocuments = useMemo(() => {
    const term = normalizedSearchTerm.toLowerCase();
    if (!term) return documents;
    return documents.filter(
      (document) =>
        document.title.toLowerCase().includes(term) ||
        (document.subject?.name.toLowerCase().includes(term) ?? false),
    );
  }, [documents, normalizedSearchTerm]);

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
              {savingId === doc.id || deletingId === doc.id ? "sync" : "edit"}
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
          <Button variant="outline" type="button" size="sm">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                filter_list
              </span>
              Bộ lọc
            </span>
          </Button>
          <Button variant="outline" type="button" size="sm">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                sort
              </span>
              Sắp xếp
            </span>
          </Button>
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
