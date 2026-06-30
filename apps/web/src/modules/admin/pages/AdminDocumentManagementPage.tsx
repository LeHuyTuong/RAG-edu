"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Table, type TableRow } from "@/components/ui/Table";
import {
  approveDocument,
  fetchDocuments,
  rejectDocument,
} from "@/apis/document.api";
import type { LibraryDocument } from "@/types/document.type";
import {
  AdminCard,
  AdminIconAction,
  MaterialIcon,
} from "../components/AdminPrimitives";

const columns = [
  { key: "title", label: "Tiêu đề", sortable: true },
  { key: "author", label: "Tác giả" },
  { key: "subject", label: "Môn học" },
  { key: "status", label: "Trạng thái" },
  { key: "actions", label: "Duyệt", align: "center" as const },
] as const;

const pageSize = 10;

const statusLabels: Record<string, string> = {
  ACTIVE: "Đã duyệt",
  PENDING: "Chờ duyệt",
  REJECTED: "Từ chối",
  DELETED: "Đã xóa",
};

const statusTone: Record<string, "success" | "warning" | "error" | "neutral"> =
  {
    ACTIVE: "success",
    PENDING: "warning",
    REJECTED: "error",
    DELETED: "neutral",
  };

export default function AdminDocumentManagementPage(): React.JSX.Element {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await fetchDocuments({ page, limit: pageSize });
      setDocuments(res.documents);
      setTotalPages(res.pagination.totalPages);
    } catch {
      toast.error("Không thể tải danh sách tài liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(currentPage);
  }, [currentPage, load]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveDocument(id);
      toast.success("Đã duyệt tài liệu");
      load(currentPage);
    } catch {
      toast.error("Không thể duyệt tài liệu");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await rejectDocument(id, { rejectionReason: "Từ chối bởi admin" });
      toast.success("Đã từ chối tài liệu");
      load(currentPage);
    } catch {
      toast.error("Không thể từ chối tài liệu");
    } finally {
      setActionLoading(null);
    }
  };

  const rows: TableRow[] = documents.map((doc) => ({
    id: doc.id,
    cells: [
      <div key="title" className="min-w-40">
        <p className="font-medium text-on-surface line-clamp-1">{doc.title}</p>
      </div>,
      <span key="author" className="text-sm text-on-surface-variant">
        {doc.author?.name ?? "Không rõ"}
      </span>,
      <span key="subject" className="text-sm text-on-surface-variant">
        {doc.subject?.name ?? "—"}
      </span>,
      <Badge key="status" tone={statusTone[doc.status] ?? "neutral"}>
        {statusLabels[doc.status] ?? doc.status}
      </Badge>,
      <div key="actions" className="flex justify-center gap-1">
        {doc.status === "PENDING" && (
          <>
            <AdminIconAction
              icon="check_circle"
              label="Duyệt"
              onClick={() => handleApprove(doc.id)}
              tone={actionLoading === doc.id ? "neutral" : "primary"}
            />
            <AdminIconAction
              icon="cancel"
              label="Từ chối"
              onClick={() => handleReject(doc.id)}
              tone="error"
            />
          </>
        )}
        {doc.status === "REJECTED" && (
          <AdminIconAction
            icon="restart_alt"
            label="Duyệt lại"
            onClick={() => handleApprove(doc.id)}
            tone="primary"
          />
        )}
      </div>,
    ],
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Quản lý tài liệu</h1>
        <p className="mt-2 text-on-surface-variant">
          Duyệt và quản lý tài liệu người dùng tải lên.
        </p>
      </div>

      <AdminCard>
        <div className="flex items-center justify-between border-b border-outline-variant p-4">
          <div>
            <h2 className="font-semibold text-on-surface">
              Danh sách tài liệu
            </h2>
            <p className="text-sm text-on-surface-variant">
              {documents.length} kết quả
            </p>
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
    </div>
  );
}
