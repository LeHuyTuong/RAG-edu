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

import {
  deleteDocument,
  fetchMyDocuments,
  fetchSubjects,
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

  const load = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchMyDocuments({ page, limit: ITEMS_PER_PAGE });
      setDocuments(res.documents);
      setPagination(res.pagination);
    } catch {
      setError("Không thể tải danh sách tài liệu. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        initialMode={openInEditMode ? "edit" : "view"}
        onCancel={() => {
          if (savingId || deletingId) return;
          setViewingDocument(null);
          setEditError(null);
          setOpenInEditMode(false);
        }}
        onDelete={(document) => void handleDelete(document.id)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
