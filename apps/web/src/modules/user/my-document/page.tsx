"use client";

/**
 * MyDocumentPage (/my-documents)
 *
 * Responsible for data fetching and coordinating state.
 * Rendering is fully delegated to child components:
 *   - DocumentStats  -> stats row
 *   - DocumentTable  -> search + table + pagination
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { AppDialog } from "@/components/ui/AppDialog";

import {
  deleteDocument,
  fetchMyDocuments,
  fetchSubjects,
  hardDeleteDocument,
  restoreDocument,
  updateDocument,
} from "@/apis/document.api";
import type {
  LibraryDocument,
  PaginationMeta,
  Subject,
  UpdateDocumentPayload,
} from "@/types/document.type";

import { DocumentDetailModal } from "./components/DocumentDetailModal";
import { DocumentStats } from "./components/DocumentStats";
import { DocumentTable } from "./components/DocumentTable";

const ITEMS_PER_PAGE = 10;

export default function MyDocumentPage(): React.JSX.Element {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [viewingDocument, setViewingDocument] =
    useState<LibraryDocument | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [openInEditMode, setOpenInEditMode] = useState(false);
  const [openInDeleteMode, setOpenInDeleteMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Replace window.confirm with custom modal state
  const [hardDeleteDoc, setHardDeleteDoc] = useState<LibraryDocument | null>(
    null,
  );
  const [restoreDoc, setRestoreDoc] = useState<LibraryDocument | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const load = useCallback(
    async (page: number, status?: string) => {
      const s = status ?? statusFilter;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchMyDocuments({
          page,
          limit: ITEMS_PER_PAGE,
          ...(s !== "ALL" ? { status: s as any } : {}),
        });
        setDocuments(res.documents);
        setPagination(res.pagination);
      } catch {
        setError("Không thể tải danh sách tài liệu. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    load(currentPage);
  }, [currentPage, load]);

  useEffect(() => {
    fetchSubjects(100)
      .then((res) => setSubjects(res.subjects))
      .catch(() => setSubjects([]));
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDocument(id);
      toast.success("Xóa tài liệu thành công!");
      const targetPage =
        documents.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;
      setCurrentPage(targetPage);
      await load(targetPage);
    } catch {
      alert("Xóa tài liệu thất bại. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
      setViewingDocument(null);
    }
  };

  const handleView = (document: LibraryDocument) => {
    setEditError(null);
    setOpenInEditMode(false);
    setViewingDocument(document);
  };

  const handleEdit = (document: LibraryDocument) => {
    setEditError(null);
    setOpenInEditMode(true);
    setViewingDocument(document);
  };

  const handleDeleteDirect = (document: LibraryDocument) => {
    setEditError(null);
    if (document.ragStatus === "SOFT_DELETED") {
      setHardDeleteDoc(document);
      return;
    }
    setOpenInDeleteMode(true);
    setViewingDocument(document);
  };

  const handleRestore = (document: LibraryDocument) => {
    setRestoreDoc(document);
  };

  const confirmHardDelete = async () => {
    const doc = hardDeleteDoc;
    if (!doc) return;
    setIsConfirming(true);
    try {
      await hardDeleteDocument(doc.id);
      toast.success("Đã xóa vĩnh viễn tài liệu.");
      const targetPage =
        documents.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;
      setCurrentPage(targetPage);
      await load(targetPage);
    } catch {
      toast.error("Xóa tài liệu thất bại. Vui lòng thử lại.");
    } finally {
      setIsConfirming(false);
      setHardDeleteDoc(null);
    }
  };

  const confirmRestore = async () => {
    const doc = restoreDoc;
    if (!doc) return;
    setIsConfirming(true);
    try {
      await restoreDocument(doc.id);
      toast.success("Khôi phục tài liệu thành công!");
      await load(currentPage);
    } catch {
      toast.error("Khôi phục tài liệu thất bại.");
    } finally {
      setIsConfirming(false);
      setRestoreDoc(null);
    }
  };

  const handleSaveEdit = async (
    document: LibraryDocument,
    payload: UpdateDocumentPayload,
  ) => {
    setSavingId(document.id);
    setEditError(null);
    try {
      await updateDocument(document.id, payload);
      setViewingDocument(null);
      await load(currentPage);
    } catch {
      setEditError("Cập nhật tài liệu thất bại. Vui lòng thử lại.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Tài liệu của tôi</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Quản lý tài liệu bạn đã tải lên.
        </p>
      </div>

      <DocumentStats
        totalDocuments={pagination?.total ?? 0}
        isLoading={isLoading}
      />

      <DocumentTable
        documents={documents}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        skeletonCount={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        onView={handleView}
        onEdit={handleEdit}
        onDeleteDirect={handleDeleteDirect}
        onRestore={handleRestore}
        onStatusChange={(status) => {
          setStatusFilter(status);
          setCurrentPage(1);
        }}
        deletingId={deletingId}
        savingId={savingId}
      />

      <DocumentDetailModal
        deletingId={deletingId}
        document={viewingDocument}
        subjects={subjects}
        isOpen={viewingDocument !== null}
        isSaving={savingId !== null}
        error={editError}
        initialMode={
          openInDeleteMode ? "delete" : openInEditMode ? "edit" : "view"
        }
        onCancel={() => {
          if (savingId || deletingId) return;
          setViewingDocument(null);
          setEditError(null);
          setOpenInEditMode(false);
          setOpenInDeleteMode(false);
        }}
        onDelete={(document) => void handleDelete(document.id)}
        onSave={handleSaveEdit}
      />

      {/* Hard-delete confirmation modal */}
      {hardDeleteDoc ? (
        <AppDialog
          title="Xóa vĩnh viễn tài liệu?"
          description={
            <>
              Thao tác này không thể hoàn tác. Tài liệu{" "}
              <span className="font-semibold text-on-surface">
                {hardDeleteDoc.title}
              </span>{" "}
              sẽ bị xóa hoàn toàn khỏi hệ thống.
            </>
          }
          icon="delete_forever"
          tone="error"
          open
          onOpenChange={(open) => {
            if (!open && !isConfirming) setHardDeleteDoc(null);
          }}
          footer={
            <>
              <Button
                disabled={isConfirming}
                variant="outline"
                onClick={() => setHardDeleteDoc(null)}
              >
                Hủy
              </Button>
              <Button
                disabled={isConfirming}
                className="bg-error text-on-error hover:bg-error/90"
                onClick={() => void confirmHardDelete()}
              >
                {isConfirming ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </Button>
            </>
          }
        >
          <div className="rounded-xl border border-error/15 bg-error/5 px-4 py-3 text-sm text-on-surface-variant">
            Tài liệu sẽ bị xóa vĩnh viễn khỏi hệ thống tra cứu RAG. Hành động
            này không thể hoàn tác.
          </div>
        </AppDialog>
      ) : null}

      {/* Restore confirmation modal */}
      {restoreDoc ? (
        <AppDialog
          title="Khôi phục tài liệu?"
          description={
            <>
              Bạn có chắc chắn muốn khôi phục tài liệu{" "}
              <span className="font-semibold text-on-surface">
                {restoreDoc.title}
              </span>{" "}
              không?
            </>
          }
          icon="restore_from_trash"
          open
          onOpenChange={(open) => {
            if (!open && !isConfirming) setRestoreDoc(null);
          }}
          footer={
            <>
              <Button
                disabled={isConfirming}
                variant="outline"
                onClick={() => setRestoreDoc(null)}
              >
                Hủy
              </Button>
              <Button
                disabled={isConfirming}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => void confirmRestore()}
              >
                {isConfirming ? "Đang khôi phục..." : "Khôi phục"}
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
