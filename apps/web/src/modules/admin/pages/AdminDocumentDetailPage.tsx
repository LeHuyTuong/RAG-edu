"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  approveDocument,
  fetchDocumentDetail,
  rejectDocument,
} from "@/apis/document.api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DocumentPreview } from "@/modules/user/documents/detail/components/DocumentPreview";
import type { DocumentPreviewData } from "@/modules/user/documents/detail/type";
import { loadDocumentPreview } from "@/modules/user/documents/detail/utils/document-preview";
import { RejectDocumentModal } from "@/modules/moderator/components/RejectDocumentModal";
import { useAuthStore } from "@/stores/auth/store";
import type { DocumentDetail, DocumentStatus } from "@/types/document.type";
import { formatDate, formatFileSize } from "@/utils";
import { getErrorMessage } from "@/utils/error";

import { AdminDocumentAiAssistant } from "../components/AdminDocumentAiAssistant";
import { AdminCard, MaterialIcon } from "../components/AdminPrimitives";

const statusLabels: Record<DocumentStatus, string> = {
  ACTIVE: "Đã duyệt",
  PENDING: "Chờ duyệt",
  REJECTED: "Từ chối",
  DELETED: "Đã xóa",
};

const statusTone: Record<
  DocumentStatus,
  "success" | "warning" | "error" | "neutral"
> = {
  ACTIVE: "success",
  PENDING: "warning",
  REJECTED: "error",
  DELETED: "neutral",
};

const quickReviewPrompts = [
  "Tài liệu này có liên quan đến lịch sử Việt Nam không?",
  "Có dấu hiệu nên từ chối tài liệu này không?",
  "Tóm tắt ngắn gọn lý do nên duyệt hoặc từ chối.",
] as const;

function DetailItem({
  label,
  value,
}: {
  readonly label: string;
  readonly value: React.ReactNode;
}): React.JSX.Element {
  return (
    <div>
      <dt className="mb-1 text-xs font-semibold uppercase text-on-surface-variant">
        {label}
      </dt>
      <dd className="text-sm text-on-surface">{value}</dd>
    </div>
  );
}

export default function AdminDocumentDetailPage({
  documentId,
}: {
  readonly documentId: string;
}): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [preview, setPreview] = useState<DocumentPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const loadDocument = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetchDocumentDetail(documentId);
      setDocument(response);

      try {
        if (!accessToken) throw new Error("Missing access token");
        setPreview((previous) => {
          if (previous?.objectUrl) URL.revokeObjectURL(previous.objectUrl);
          return previous;
        });
        setPreview(await loadDocumentPreview(response, accessToken));
      } catch {
        setPreview({ type: "unsupported" });
      }
    } catch (error) {
      setDocument(null);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [documentId, accessToken]);

  useEffect(() => {
    return () => {
      if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl);
    };
  }, [preview?.objectUrl]);

  useEffect(() => {
    void loadDocument();
  }, [loadDocument]);

  const handleApprove = async () => {
    if (!document) return;

    setActionLoading(true);
    try {
      const response = await approveDocument(document.id);
      setDocument(response);
      toast.success("Đã duyệt tài liệu");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (rejectionReason: string) => {
    if (!document) return;

    setActionLoading(true);
    try {
      const response = await rejectDocument(document.id, { rejectionReason });
      setDocument(response);
      setRejectOpen(false);
      toast.success("Đã từ chối tài liệu");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminCard className="p-6">
        <p className="text-on-surface-variant">Đang tải chi tiết tài liệu...</p>
      </AdminCard>
    );
  }

  if (!document) {
    return (
      <AdminCard className="p-6">
        <h1 className="text-xl font-semibold text-on-surface">
          Không tìm thấy tài liệu
        </h1>
        <p className="mt-2 text-on-surface-variant">
          {errorMessage || "Mã tài liệu không tồn tại."}
        </p>
        <Link
          className="mt-4 inline-flex items-center gap-2 text-primary"
          href="/admin/documents"
        >
          <MaterialIcon name="arrow_back" />
          Quay lại danh sách
        </Link>
      </AdminCard>
    );
  }

  const status = document.status ?? "PENDING";
  const canReview = status === "PENDING";
  const assistantDocuments = [
    {
      id: document.id,
      title: document.title,
      subtitle: document.subject?.name ?? document.format.toUpperCase(),
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
        <Link className="hover:text-primary" href="/admin/documents">
          Quản lý tài liệu
        </Link>
        <MaterialIcon className="text-sm" name="chevron_right" />
        <span className="text-on-surface">{document.id}</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">
            {document.title}
          </h1>
          <p className="mt-2 max-w-3xl text-on-surface-variant">
            Xem nội dung, hỏi AI hỗ trợ kiểm duyệt và quyết định duyệt hoặc từ
            chối tài liệu này.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!canReview || actionLoading}
            onClick={() => setRejectOpen(true)}
            variant="destructive"
          >
            Từ chối tài liệu
          </Button>
          <Button
            disabled={!canReview || actionLoading}
            onClick={() => void handleApprove()}
          >
            {actionLoading ? "Đang xử lý..." : "Duyệt tài liệu"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
        <div className="space-y-6">
          <AdminCard className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-4">
              <h2 className="flex items-center gap-2 font-semibold text-on-surface">
                <MaterialIcon className="text-primary" name="article" />
                Xem trước tài liệu
              </h2>
              <a
                className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                href={document.fileUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <MaterialIcon name="open_in_new" />
                Mở tệp gốc
              </a>
            </div>
            <div className="bg-surface-container-low p-4">
              <DocumentPreview preview={preview ?? { type: "unsupported" }} />
            </div>
          </AdminCard>
        </div>

        <aside className="space-y-6">
          <AdminCard className="p-5">
            <h2 className="mb-4 font-semibold text-on-surface">
              Thông tin tài liệu
            </h2>
            <dl className="space-y-4">
              <DetailItem
                label="Trạng thái"
                value={
                  <Badge tone={statusTone[status] ?? "neutral"}>
                    {statusLabels[status] ?? status}
                  </Badge>
                }
              />
              <DetailItem
                label="Tác giả"
                value={
                  <span>
                    {document.author.name}
                    <span className="mt-1 block text-on-surface-variant">
                      {document.author.email}
                    </span>
                  </span>
                }
              />
              <DetailItem
                label="Môn học"
                value={document.subject?.name ?? "Chưa phân loại"}
              />
              <DetailItem
                label="Mô tả"
                value={document.description || "Tài liệu chưa có mô tả."}
              />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Định dạng"
                  value={document.format.toUpperCase()}
                />
                <DetailItem
                  label="Dung lượng"
                  value={formatFileSize(document.sizeInBytes)}
                />
                <DetailItem
                  label="Số trang"
                  value={document.pageCount ? `${document.pageCount}` : "—"}
                />
                <DetailItem
                  label="Ngày tải"
                  value={formatDate(document.createdAt)}
                />
              </div>
              {document.rejectionReason ? (
                <DetailItem
                  label="Lý do từ chối"
                  value={document.rejectionReason}
                />
              ) : null}
            </dl>
          </AdminCard>

          <AdminCard className="p-5">
            <h2 className="mb-4 font-semibold text-on-surface">
              Tín hiệu AI có sẵn
            </h2>
            <dl className="space-y-4">
              <DetailItem
                label="RAG status"
                value={String(document.ragStatus ?? "Chưa có")}
              />
              <DetailItem
                label="Độ tin cậy"
                value={
                  typeof document.aiConfidence === "number"
                    ? `${Math.round(document.aiConfidence * 100)}%`
                    : "Chưa có"
                }
              />
              <DetailItem
                label="Cảnh báo"
                value={document.aiWarningLevel ?? "Chưa có"}
              />
              <DetailItem
                label="Nhận xét AI"
                value={document.rejectionReason ?? "Chưa có nhận xét tự động."}
              />
            </dl>
          </AdminCard>
        </aside>
      </div>

      <RejectDocumentModal
        open={rejectOpen}
        isSubmitting={actionLoading}
        onCancel={() => {
          if (!actionLoading) setRejectOpen(false);
        }}
        onConfirm={handleReject}
      />
      <AdminDocumentAiAssistant
        documents={assistantDocuments}
        emptyContextMessage="Không có tài liệu nào trong context."
        submitLabel="Gửi câu hỏi"
        suggestions={quickReviewPrompts}
        textareaLabel="Hỏi AI về tài liệu này"
      />
    </div>
  );
}
