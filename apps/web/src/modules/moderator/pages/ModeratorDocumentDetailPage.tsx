"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import {
  approveDocument,
  fetchDocumentDetail,
  rejectDocument,
} from "@/apis/document.api";
import type { DocumentDetail, DocumentStatus } from "@/types/document.type";
import { formatDate } from "@/utils";
import { DocumentPreview } from "@/modules/user/documents/detail/components/DocumentPreview";
import type { DocumentPreviewData } from "@/modules/user/documents/detail/type";
import { loadDocumentPreview } from "@/modules/user/documents/detail/utils/document-preview";

import {
  EmptyState,
  MaterialIcon,
  ModeratorBadge,
  ModeratorCard,
} from "../components/ModeratorPrimitives";
import { RejectDocumentModal } from "../components/RejectDocumentModal";

const statusLabelMap: Record<DocumentStatus, string> = {
  PENDING: "Chờ duyệt",
  ACTIVE: "Đã duyệt",
  REJECTED: "Đã từ chối",
  DELETED: "Đã xóa",
};

const statusToneMap: Record<
  DocumentStatus,
  "primary" | "secondary" | "tertiary" | "error" | "neutral"
> = {
  PENDING: "tertiary",
  ACTIVE: "primary",
  REJECTED: "error",
  DELETED: "neutral",
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function ModeratorDocumentDetailPage({
  documentId,
}: {
  readonly documentId: string;
}): React.JSX.Element {
  const router = useRouter();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [preview, setPreview] = useState<DocumentPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const loadDocument = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchDocumentDetail(documentId);
      setDocument(response);

      try {
        setPreview(await loadDocumentPreview(response));
      } catch (previewError) {
        console.error(
          "Could not load moderator document preview",
          previewError,
        );
        setPreview(null);
      }
    } catch {
      setDocument(null);
      setError("Không thể tải chi tiết tài liệu.");
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const handleApprove = async () => {
    if (!document) return;

    setIsSubmitting(true);
    try {
      await approveDocument(document.id);
      toast.success(`Đã phê duyệt ${document.title}`);
      router.push("/moderator/documents");
      router.refresh();
    } catch {
      toast.error(`Không thể phê duyệt ${document.title}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectConfirm = async (rejectionReason: string) => {
    if (!document) return;

    setIsSubmitting(true);
    try {
      await rejectDocument(document.id, { rejectionReason });
      toast.success(`Đã từ chối ${document.title}`);
      setIsRejecting(false);
      router.push("/moderator/documents");
      router.refresh();
    } catch {
      toast.error(`Không thể từ chối ${document.title}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-6 py-12 text-center font-label-md text-label-md text-on-surface-variant">
        Đang tải chi tiết tài liệu...
      </div>
    );
  }

  if (error || !document) {
    return (
      <EmptyState
        description={
          error ?? "Mã tài liệu không tồn tại hoặc bạn không có quyền xem."
        }
        title="Không tìm thấy tài liệu"
      />
    );
  }

  const status = document.status ?? "PENDING";
  const canReview = status === "PENDING";

  return (
    <>
      <nav
        aria-label="Đường dẫn trang"
        className="mb-6 flex flex-wrap items-center gap-2 font-label-sm text-label-sm text-on-surface-variant"
      >
        <Link className="hover:text-primary" href="/moderator">
          Kiểm duyệt
        </Link>
        <MaterialIcon className="text-sm" name="chevron_right" />
        <Link className="hover:text-primary" href="/moderator/documents">
          Tài liệu chờ
        </Link>
        <MaterialIcon className="text-sm" name="chevron_right" />
        <span className="text-on-surface">{document.id}</span>
      </nav>

      <div className="grid grid-cols-1 gap-gutter xl:grid-cols-12 xl:items-start">
        <div className="space-y-gutter xl:col-span-8">
          <ModeratorCard className="overflow-hidden rounded-xl">
            <div className="flex flex-col gap-3 border-b border-outline-variant bg-surface-container-low px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <MaterialIcon className="text-primary" name="article" />
                <h1 className="truncate font-label-md text-label-md">
                  Xem trước: {document.title}
                </h1>
              </div>
              <a
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-label-sm text-label-sm text-on-primary"
                href={document.fileUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <MaterialIcon name="open_in_new" />
                Mở tệp
              </a>
            </div>
            <div className="bg-surface-container p-4">
              <DocumentPreview preview={preview ?? { type: "unsupported" }} />
            </div>
          </ModeratorCard>
        </div>

        <aside className="space-y-gutter xl:col-span-4">
          <ModeratorCard className="rounded-xl p-6">
            <h2 className="mb-6 flex items-center gap-2 font-headline-md text-headline-md">
              <MaterialIcon name="info" />
              Thông tin chi tiết
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Tên tài liệu
                </dt>
                <dd className="font-label-md text-label-md">
                  {document.title}
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Mô tả
                </dt>
                <dd className="font-body-md text-body-md">
                  {document.description || "Tài liệu chưa có mô tả."}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Dung lượng
                  </dt>
                  <dd className="font-label-md text-label-md">
                    {formatBytes(document.sizeInBytes)}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Định dạng
                  </dt>
                  <dd className="font-label-md text-label-md">
                    {document.format.toUpperCase()}
                  </dd>
                </div>
              </div>
              <div>
                <dt className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Tác giả
                </dt>
                <dd className="font-label-md text-label-md">
                  {document.author.name}
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Ngày tải
                </dt>
                <dd className="font-label-md text-label-md">
                  {formatDate(document.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Môn học
                </dt>
                <dd>
                  <ModeratorBadge tone="secondary">
                    {document.subject?.name ?? "Chưa phân loại"}
                  </ModeratorBadge>
                </dd>
              </div>
              <div>
                <dt className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Trạng thái
                </dt>
                <dd>
                  <ModeratorBadge tone={statusToneMap[status]}>
                    {statusLabelMap[status]}
                  </ModeratorBadge>
                </dd>
              </div>
            </dl>
          </ModeratorCard>

          <section className="sticky top-24 rounded-xl border-2 border-primary bg-surface-container-low p-6">
            <h2 className="mb-4 flex items-center gap-2 font-headline-md text-headline-md text-primary">
              <MaterialIcon name="verified_user" />
              Bảng kiểm duyệt
            </h2>
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                className="flex items-center justify-center gap-2 rounded-lg bg-on-error-container py-3 font-label-md text-label-md text-on-error transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canReview || isSubmitting}
                onClick={() => setIsRejecting(true)}
                type="button"
              >
                <MaterialIcon name="close" />
                Từ chối
              </button>
              <button
                className="flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canReview || isSubmitting}
                onClick={() => void handleApprove()}
                type="button"
              >
                <MaterialIcon name="check" />
                Phê duyệt
              </button>
            </div>
            {!canReview ? (
              <p className="mt-4 font-label-sm text-label-sm text-on-surface-variant">
                Tài liệu này không còn ở trạng thái chờ duyệt.
              </p>
            ) : null}
          </section>
        </aside>
      </div>

      <RejectDocumentModal
        open={isRejecting}
        isSubmitting={isSubmitting}
        onCancel={() => {
          if (isSubmitting) return;
          setIsRejecting(false);
        }}
        onConfirm={handleRejectConfirm}
      />
    </>
  );
}
