"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  approveDocument,
  deleteDocument,
  fetchDocuments,
  hardDeleteDocument,
  reclassifyDocument,
  restoreDocument,
} from "@/apis/document.api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AppDialog } from "@/components/ui/AppDialog";
import { Pagination } from "@/components/ui/Pagination";
import { SelectField } from "@/components/ui/SelectField";
import { Table, type TableRow } from "@/components/ui/Table";
import { getRagStatusDisplay } from "@/shared/documentStatus";
import type { DocumentRagStatus, LibraryDocument } from "@/types/document.type";
import { getErrorMessage } from "@/utils/error";

import { AdminDocumentAiAssistant } from "../components/AdminDocumentAiAssistant";
import { AdminCard, MaterialIcon } from "../components/AdminPrimitives";

const columns = [
  { key: "select", label: "Chọn", align: "center" as const },
  { key: "title", label: "Tiêu đề", sortable: true },
  { key: "author", label: "Người tải" },
  { key: "subject", label: "Danh mục lịch sử" },
  { key: "confidence", label: "Chỉ số AI", align: "center" as const },
  { key: "status", label: "Trạng thái xử lý" },
  { key: "actions", label: "Thao tác", align: "center" as const },
] as const;

const pageSize = 10;

const STATUS_OPTIONS: { label: string; value: "ALL" | DocumentRagStatus }[] = [
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

// Removed local sort options as the backend handles newest-first sorting

const suggestedQuestions = [
  "Các tài liệu đã chọn có phù hợp để duyệt không?",
  "Có tài liệu nào không liên quan đến lịch sử không?",
  "Tóm tắt lý do nên duyệt hoặc cần từ chối.",
] as const;

// Chỉ tài liệu đang chờ kiểm duyệt mới được chọn để duyệt (không phải doc
// đang INDEXING/FAILED/READY). Dựa trên state machine thật qua ragStatus.
const canSelectForReview = (document: LibraryDocument): boolean =>
  document.ragStatus === "PENDING_REVIEW";

function ConfidenceBadge({
  confidence,
}: {
  confidence: number | null | undefined;
}) {
  if (confidence == null)
    return <span className="text-sm text-on-surface-variant">—</span>;
  const pct = Math.round(confidence * 100);
  const tone = pct >= 90 ? "success" : pct >= 70 ? "warning" : "error";
  return <Badge tone={tone}>{pct}%</Badge>;
}

export default function AdminDocumentManagementPage(): React.JSX.Element {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkApproveLoading, setBulkApproveLoading] = useState(false);
  const [reclassifyingId, setReclassifyingId] = useState<string | null>(null);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [deleteDocTitle, setDeleteDocTitle] = useState("");
  const [isHardDelete, setIsHardDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [restoreTitle, setRestoreTitle] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  const [filterStatus, setFilterStatus] = useState<"ALL" | DocumentRagStatus>(
    "ALL",
  );

  const load = useCallback(
    async (page: number, statusFilter: "ALL" | DocumentRagStatus) => {
      setLoading(true);
      try {
        const res = await fetchDocuments({
          page,
          limit: pageSize,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
        });
        setDocuments(res.documents);
        setTotalPages(res.pagination.totalPages);
        setSelectedDocumentIds((current) => {
          const availableIds = new Set(
            res.documents
              .filter(canSelectForReview)
              .map((document) => String(document.id)),
          );
          return new Set([...current].filter((id) => availableIds.has(id)));
        });
      } catch {
        toast.error("Không thể tải danh sách tài liệu");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(currentPage, filterStatus);
  }, [currentPage, filterStatus, load]);

  const selectedDocuments = useMemo(
    () =>
      documents.filter(
        (document) =>
          canSelectForReview(document) &&
          selectedDocumentIds.has(String(document.id)),
      ),
    [documents, selectedDocumentIds],
  );

  const assistantDocuments = useMemo(
    () =>
      selectedDocuments.map((document) => ({
        id: document.id,
        title: document.title,
        subtitle: document.subject?.name ?? document.format.toUpperCase(),
      })),
    [selectedDocuments],
  );

  // local sortOption removed

  const visibleDocuments = documents; // Filter and sort are handled by the backend

  const selectableDocuments = useMemo(
    () => visibleDocuments.filter(canSelectForReview),
    [visibleDocuments],
  );

  const allVisibleSelected =
    selectableDocuments.length > 0 &&
    selectableDocuments.every((document) =>
      selectedDocumentIds.has(String(document.id)),
    );

  const canBulkApprove = selectedDocuments.length > 0 && !bulkApproveLoading;

  const toggleDocument = (documentId: string, checked: boolean) => {
    setSelectedDocumentIds((current) => {
      const document = documents.find((item) => String(item.id) === documentId);
      if (checked && (!document || !canSelectForReview(document))) {
        return current;
      }

      const next = new Set(current);
      if (checked) {
        next.add(documentId);
      } else {
        next.delete(documentId);
      }
      return next;
    });
  };

  const toggleAllVisible = (checked: boolean) => {
    setSelectedDocumentIds((current) => {
      const next = new Set(current);
      selectableDocuments.forEach((document) => {
        if (checked) {
          next.add(String(document.id));
        } else {
          next.delete(String(document.id));
        }
      });
      return next;
    });
  };

  const handleBulkApprove = async () => {
    if (selectedDocuments.length === 0) return;

    setBulkApproveLoading(true);
    try {
      for (const document of selectedDocuments) {
        await approveDocument(document.id);
      }
      toast.success(`Đã duyệt ${selectedDocuments.length} tài liệu`);
      setSelectedDocumentIds(new Set());
      await load(currentPage, filterStatus);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBulkApproveLoading(false);
    }
  };

  const handleReclassify = async (documentId: string) => {
    if (!window.confirm("Phân loại lại tài liệu này bằng AI?")) return;
    setReclassifyingId(documentId);
    try {
      await reclassifyDocument(documentId);
      toast.success(
        "Đã gửi yêu cầu phân loại lại. AI sẽ xử lý trong vài giây.",
      );
      // Auto-refresh sau 5s để AI có thời gian xử lý
      setTimeout(() => void load(currentPage, filterStatus), 5000);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setReclassifyingId(null);
    }
  };

  const handleDelete = async (
    documentId: string,
    title: string,
    hard = false,
  ) => {
    setDeleteDocId(documentId);
    setDeleteDocTitle(title);
    setIsHardDelete(hard);
  };

  const handleRestore = (documentId: string, title: string) => {
    setRestoreId(documentId);
    setRestoreTitle(title);
  };

  const confirmDelete = async () => {
    if (!deleteDocId) return;
    setIsDeleting(true);
    try {
      if (isHardDelete) {
        await hardDeleteDocument(deleteDocId);
        toast.success("Đã xóa vĩnh viễn tài liệu.");
      } else {
        await deleteDocument(deleteDocId);
        toast.success("Đã chuyển tài liệu vào thùng rác.");
      }
      setDeleteDocId(null);
      setDeleteDocTitle("");
      setIsHardDelete(false);
      await load(currentPage, filterStatus);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmRestore = async () => {
    if (!restoreId) return;
    setIsRestoring(true);
    try {
      await restoreDocument(restoreId);
      toast.success("Khôi phục tài liệu thành công!");
      setRestoreId(null);
      setRestoreTitle("");
      await load(currentPage, filterStatus);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsRestoring(false);
    }
  };

  const rows: TableRow[] = visibleDocuments.map((doc) => ({
    id: doc.id,
    highlighted:
      canSelectForReview(doc) && selectedDocumentIds.has(String(doc.id)),
    cells: [
      canSelectForReview(doc) ? (
        <input
          aria-label={`Chọn ${doc.title}`}
          checked={selectedDocumentIds.has(String(doc.id))}
          className="h-4 w-4 accent-primary"
          key="select"
          onChange={(event) =>
            toggleDocument(String(doc.id), event.target.checked)
          }
          type="checkbox"
        />
      ) : (
        <span
          aria-hidden="true"
          className="text-sm text-on-surface-variant"
          key="select"
        >
          —
        </span>
      ),
      <div key="title" className="min-w-56">
        <p className="font-medium text-on-surface line-clamp-1">{doc.title}</p>
        <p className="mt-1 text-xs text-on-surface-variant">
          {doc.format.toUpperCase()} · {doc.chunkCount ?? 0} chunks ·{" "}
          {doc.isPublic ? "Công khai" : "Riêng tư"}
        </p>
      </div>,
      <span key="author" className="text-sm text-on-surface-variant">
        {doc.author?.name ?? "Không rõ"}
      </span>,
      <span key="subject" className="text-sm text-on-surface-variant">
        {doc.subject?.name ?? "—"}
      </span>,
      <ConfidenceBadge key="confidence" confidence={doc.aiConfidence} />,
      <Badge
        key="status"
        tone={getRagStatusDisplay(doc.ragStatus, doc.isPublic).tone}
      >
        {getRagStatusDisplay(doc.ragStatus, doc.isPublic).label}
      </Badge>,
      <div key="actions" className="flex items-center justify-center gap-1">
        {doc.ragStatus === "FAILED" && (
          <button
            aria-label={`Phân loại lại ${doc.title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
            disabled={reclassifyingId === String(doc.id)}
            onClick={() => handleReclassify(String(doc.id))}
            title="Phân loại lại bằng AI"
          >
            <MaterialIcon
              name={
                reclassifyingId === String(doc.id)
                  ? "progress_activity"
                  : "replay"
              }
              className={
                reclassifyingId === String(doc.id) ? "animate-spin" : ""
              }
            />
          </button>
        )}
        <Link
          aria-label={`Xem chi tiết ${doc.title}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
          href={`/admin/documents/${doc.id}`}
          title={`Xem chi tiết ${doc.title}`}
        >
          <MaterialIcon name="visibility" />
        </Link>
        {doc.ragStatus === "SOFT_DELETED" ? (
          <>
            <button
              aria-label={`Khôi phục ${doc.title}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => handleRestore(String(doc.id), doc.title)}
              title={`Khôi phục ${doc.title}`}
              type="button"
            >
              <MaterialIcon name="restore_from_trash" />
            </button>
            <button
              aria-label={`Xóa vĩnh viễn ${doc.title}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error"
              onClick={() => handleDelete(String(doc.id), doc.title, true)}
              title={`Xóa vĩnh viễn ${doc.title}`}
              type="button"
            >
              <MaterialIcon name="delete_forever" />
            </button>
          </>
        ) : (
          <button
            aria-label={`Xóa ${doc.title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error"
            onClick={() => handleDelete(String(doc.id), doc.title)}
            title={`Xóa ${doc.title}`}
            type="button"
          >
            <MaterialIcon name="delete" />
          </button>
        )}
      </div>,
    ],
  }));

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Quản lý tài liệu</h1>
        <p className="mt-2 text-on-surface-variant">
          Duyệt, phân tích bằng AI và quản lý tư liệu lịch sử người dùng tải
          lên.
        </p>
      </div>

      <AdminCard>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant p-4">
          <div>
            <h2 className="font-semibold text-on-surface">
              Danh sách tài liệu
            </h2>
            <p className="text-sm text-on-surface-variant">
              {visibleDocuments.length} kết quả
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-44">
              <SelectField
                options={STATUS_OPTIONS}
                value={filterStatus}
                onChange={(value) =>
                  setFilterStatus(value as "ALL" | DocumentRagStatus)
                }
              />
            </div>

            <label className="ml-2 flex items-center gap-2 text-sm text-on-surface-variant">
              <input
                checked={allVisibleSelected}
                className="h-4 w-4 accent-primary"
                disabled={selectableDocuments.length === 0}
                onChange={(event) => toggleAllVisible(event.target.checked)}
                type="checkbox"
              />
              Chọn tất cả
            </label>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-on-surface-variant">Đang tải...</div>
        ) : rows.length > 0 ? (
          <Table columns={columns} rows={rows} />
        ) : (
          <div className="p-6 text-on-surface-variant">
            Không có tài liệu nào.
          </div>
        )}

        <div className="flex items-center justify-between border-t border-outline-variant p-4">
          <p className="text-sm text-on-surface-variant">
            Trang {currentPage}/{totalPages}
          </p>
          <Pagination
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalPages={totalPages}
          />
        </div>
      </AdminCard>

      <AdminDocumentAiAssistant
        approveDisabled={!canBulkApprove}
        approveLabel={`Duyệt ${selectedDocuments.length} tài liệu`}
        approveLoading={bulkApproveLoading}
        documents={assistantDocuments}
        emptyContextMessage="Chọn một hoặc nhiều tài liệu trong bảng."
        onApprove={handleBulkApprove}
        suggestions={suggestedQuestions}
        textareaLabel="Câu hỏi AI cho các tài liệu đã chọn"
      />

      {deleteDocId ? (
        <AppDialog
          title={
            isHardDelete ? "Xóa vĩnh viễn tài liệu?" : "Chuyển vào thùng rác?"
          }
          description={
            isHardDelete ? (
              <>
                Bạn sắp xóa vĩnh viễn tài liệu{" "}
                <span className="font-semibold text-on-surface">
                  {deleteDocTitle}
                </span>
                . Thao tác này không thể hoàn tác.
              </>
            ) : (
              <>
                Bạn sắp chuyển tài liệu{" "}
                <span className="font-semibold text-on-surface">
                  {deleteDocTitle}
                </span>{" "}
                vào thùng rác. Bạn có thể khôi phục lại bất kỳ lúc nào.
              </>
            )
          }
          icon="delete_forever"
          tone={isHardDelete ? "error" : "neutral"}
          open
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setDeleteDocId(null);
              setDeleteDocTitle("");
              setIsHardDelete(false);
            }
          }}
          footer={
            <>
              <Button
                disabled={isDeleting}
                variant="outline"
                onClick={() => {
                  setDeleteDocId(null);
                  setDeleteDocTitle("");
                  setIsHardDelete(false);
                }}
              >
                Hủy
              </Button>
              <Button
                disabled={isDeleting}
                className={
                  isHardDelete
                    ? "bg-error text-on-error hover:bg-error/90"
                    : "bg-amber-600 text-white hover:bg-amber-700"
                }
                onClick={() => void confirmDelete()}
              >
                {isDeleting
                  ? "Đang xóa..."
                  : isHardDelete
                    ? "Xóa vĩnh viễn"
                    : "Chuyển vào thùng rác"}
              </Button>
            </>
          }
        >
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              isHardDelete
                ? "border-error/15 bg-error/5 text-on-surface-variant"
                : "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
            }`}
          >
            {isHardDelete
              ? "Tài liệu sẽ bị xóa vĩnh viễn khỏi hệ thống tra cứu RAG. Hành động này không thể hoàn tác."
              : "Tài liệu sẽ được chuyển vào thùng rác. Bạn có thể khôi phục lại bất kỳ lúc nào."}
          </div>
        </AppDialog>
      ) : null}

      {restoreId ? (
        <AppDialog
          title="Khôi phục tài liệu?"
          description={
            <>
              Bạn sắp khôi phục tài liệu{" "}
              <span className="font-semibold text-on-surface">
                {restoreTitle}
              </span>
              . Tài liệu sẽ trở lại trạng thái hoạt động.
            </>
          }
          icon="restore_from_trash"
          open
          onOpenChange={(open) => {
            if (!open && !isRestoring) {
              setRestoreId(null);
              setRestoreTitle("");
            }
          }}
          footer={
            <>
              <Button
                disabled={isRestoring}
                variant="outline"
                onClick={() => {
                  setRestoreId(null);
                  setRestoreTitle("");
                }}
              >
                Hủy
              </Button>
              <Button
                disabled={isRestoring}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => void confirmRestore()}
              >
                {isRestoring ? "Đang khôi phục..." : "Khôi phục"}
              </Button>
            </>
          }
        >
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
            Tài liệu sẽ được khôi phục và có thể truy cập trở lại.
          </div>
        </AppDialog>
      ) : null}
    </div>
  );
}
