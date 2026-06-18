"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  fetchDocuments,
  approveDocument,
  rejectDocument,
} from "@/apis/document.api";
import { Pagination } from "@/components/ui/Pagination";
import { Table, type TableRow } from "@/components/ui/Table";
import type { LibraryDocument } from "@/types/document.type";
import { formatDate } from "@/utils";

import {
  EmptyState,
  IconButton,
  MaterialIcon,
  ModeratorBadge,
  ModeratorCard,
} from "../components/ModeratorPrimitives";
import { RejectDocumentModal } from "../components/RejectDocumentModal";

const pageSize = 10;

const documentColumns = [
  { key: "title", label: "TIÊU ĐỀ TÀI LIỆU" },
  { key: "author", label: "TÁC GIẢ" },
  { key: "subject", label: "MÔN HỌC" },
  { key: "uploadDate", label: "NGÀY TẢI" },
  { key: "status", label: "TRẠNG THÁI" },
  { key: "actions", label: "THAO TÁC", align: "right" as const },
] as const;

function formatDocumentType(publicId: string): string {
  const extension = publicId.split(".").pop()?.toUpperCase();
  return extension && extension.length <= 5 ? extension : "FILE";
}

export default function ModeratorDocumentsPage(): React.JSX.Element {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectingDocument, setRejectingDocument] =
    useState<LibraryDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchDocuments({
        page: currentPage,
        limit: pageSize,
        status: "PENDING",
      });
      setDocuments(response.documents);
    } catch {
      setDocuments([]);
      setError("Không thể tải danh sách tài liệu chờ duyệt.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return documents;

    return documents.filter((document) =>
      [
        document.title,
        document.author.name,
        document.subject?.name,
        document.subject?.code,
        document.id,
      ].some((value) => (value ?? "").toLowerCase().includes(normalizedQuery)),
    );
  }, [documents, query]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDocuments.length / pageSize),
  );
  const visibleDocuments = filteredDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleApprove = useCallback(
    async (document: LibraryDocument) => {
      setActionId(document.id);
      try {
        await approveDocument(document.id);
        toast.success(`Đã phê duyệt ${document.title}`);
        await loadDocuments();
      } catch {
        toast.error(`Không thể phê duyệt ${document.title}`);
      } finally {
        setActionId(null);
      }
    },
    [loadDocuments],
  );

  const handleRejectConfirm = useCallback(
    async (rejectionReason: string) => {
      if (!rejectingDocument) return;

      setActionId(rejectingDocument.id);
      try {
        await rejectDocument(rejectingDocument.id, { rejectionReason });
        toast.success(`Đã từ chối ${rejectingDocument.title}`);
        setRejectingDocument(null);
        await loadDocuments();
      } catch {
        toast.error(`Không thể từ chối ${rejectingDocument.title}`);
      } finally {
        setActionId(null);
      }
    },
    [loadDocuments, rejectingDocument],
  );

  const documentRows: TableRow[] = visibleDocuments.map((document) => {
    const isActing = actionId === document.id;

    return {
      id: document.id,
      cells: [
        <div className="flex items-center gap-3" key="title">
          <div className="flex h-12 w-10 items-center justify-center rounded-sm bg-primary-fixed">
            <MaterialIcon className="text-primary" name="article" />
          </div>
          <div>
            <p className="max-w-[280px] truncate font-label-md text-label-md text-on-surface">
              {document.title}
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {formatDocumentType(document.publicId)} • {document.id}
            </p>
          </div>
        </div>,
        <div className="flex items-center gap-2" key="author">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-high text-[10px] font-bold text-on-surface-variant">
            {document.author.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-body-md text-body-md text-on-surface">
            {document.author.name}
          </span>
        </div>,
        <ModeratorBadge key="subject" tone="secondary">
          {document.subject?.name ?? "Chưa phân loại"}
        </ModeratorBadge>,
        <span
          className="font-body-md text-body-md text-on-surface"
          key="uploadDate"
        >
          {formatDate(document.createdAt)}
        </span>,
        <ModeratorBadge key="status" tone="tertiary">
          Chờ duyệt
        </ModeratorBadge>,
        <div className="flex justify-end gap-2" key="actions">
          <IconButton
            href={`/moderator/documents/${document.id}`}
            icon="visibility"
            label={`Xem chi tiết ${document.title}`}
          />
          <IconButton
            icon={isActing ? "hourglass_empty" : "close"}
            label={`Từ chối ${document.title}`}
            onClick={() => setRejectingDocument(document)}
            tone="error"
          />
          <IconButton
            icon={isActing ? "hourglass_empty" : "check"}
            label={`Phê duyệt ${document.title}`}
            onClick={() => void handleApprove(document)}
            tone="primary"
          />
        </div>,
      ],
    };
  });

  return (
    <div className="space-y-gutter">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mb-1 font-headline-lg text-headline-lg text-on-surface">
            Kiểm Duyệt Tài Liệu
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Xem, phê duyệt hoặc từ chối các tài liệu công khai đang chờ duyệt.
          </p>
        </div>
        <div className="flex w-full max-w-sm items-center gap-4 bg-surface-container-high px-4 py-2 lg:w-auto">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Chờ Duyệt
            </p>
            <p className="font-headline-md text-headline-md text-primary">
              {documents.length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <label className="border border-outline-variant bg-white p-4 transition-colors hover:border-primary md:col-span-3">
          <span className="mb-2 flex items-center gap-3 font-label-md text-label-md text-on-surface">
            <MaterialIcon className="text-primary" name="search" />
            Tìm kiếm
          </span>
          <input
            className="w-full border-none bg-transparent p-0 font-label-sm text-label-sm text-on-surface-variant outline-none"
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tên tài liệu, tác giả, môn học, mã ID..."
            type="search"
            value={query}
          />
        </label>
        <button
          className="flex items-center justify-center gap-2 bg-surface-container-highest p-4 font-label-md text-label-md text-on-surface transition-colors hover:bg-outline-variant"
          onClick={() => {
            setQuery("");
            setCurrentPage(1);
            void loadDocuments();
          }}
          type="button"
        >
          <MaterialIcon name="refresh" />
          Làm mới
        </button>
      </div>

      <ModeratorCard className="overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-12 text-center font-label-md text-label-md text-on-surface-variant">
            Đang tải tài liệu chờ duyệt...
          </div>
        ) : error ? (
          <EmptyState description={error} title="Không thể tải tài liệu" />
        ) : filteredDocuments.length === 0 ? (
          <EmptyState
            description="Không còn tài liệu chờ duyệt hoặc không có kết quả phù hợp với tìm kiếm."
            title="Không có tài liệu phù hợp"
          />
        ) : (
          <Table columns={documentColumns} rows={documentRows} />
        )}
        <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-container-lowest px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Hiển thị {visibleDocuments.length} của {filteredDocuments.length}{" "}
            tài liệu
          </p>
          <Pagination
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalPages={totalPages}
          />
        </div>
      </ModeratorCard>

      <RejectDocumentModal
        open={rejectingDocument !== null}
        isSubmitting={actionId === rejectingDocument?.id}
        onCancel={() => {
          if (actionId) return;
          setRejectingDocument(null);
        }}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}
