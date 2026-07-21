/**
 * Hiển thị trạng thái tài liệu theo state machine (UML) của backend.
 *
 * Nguồn chân lý là `ragStatus` (enum 9 state của DocumentStatus phía backend):
 * UPLOADING · REVIEWING · PENDING_REVIEW · INDEXING · REINDEXING · READY · FAILED · REJECTED · SOFT_DELETED.
 *
 * Trước đây frontend đọc chuỗi `status` bị nén (ACTIVE/PENDING/REJECTED/DELETED) nên
 * mất các state INDEXING/FAILED/REINDEXING → hiển thị nhầm "Chờ duyệt". Dùng helper này
 * để hiển thị đúng từng state.
 */
import type { DocumentRagStatus, DocumentStatus } from "@/types/document.type";

export type DocumentBadgeTone = "success" | "warning" | "error" | "neutral";

export interface DocumentStatusDisplay {
  label: string;
  tone: DocumentBadgeTone;
}

/**
 * Map ragStatus (+ isPublic để phân biệt "Đã duyệt (công khai)" vs "Riêng tư"
 * khi đã READY) thành nhãn + tone để hiển thị.
 */
export function getRagStatusDisplay(
  ragStatus: DocumentRagStatus | null | undefined,
  isPublic: boolean,
): DocumentStatusDisplay {
  switch (ragStatus) {
    case "UPLOADING":
      return { label: "Đang tải lên", tone: "neutral" };
    case "REVIEWING":
      return { label: "Đang kiểm duyệt", tone: "warning" };
    case "PENDING_REVIEW":
      return { label: "Chờ duyệt", tone: "warning" };
    case "INDEXING":
      return { label: "Đang index", tone: "warning" };
    case "REINDEXING":
      return { label: "Đang index lại", tone: "warning" };
    case "READY":
      return isPublic
        ? { label: "Đã duyệt (công khai)", tone: "success" }
        : { label: "Riêng tư", tone: "neutral" };
    case "FAILED":
      return { label: "Index lỗi", tone: "error" };
    case "REJECTED":
      return { label: "Bị từ chối", tone: "error" };
    case "SOFT_DELETED":
      return { label: "Đã xóa", tone: "neutral" };
    default:
      return { label: "Không rõ", tone: "neutral" };
  }
}

/**
 * Fallback khi item chỉ có chuỗi `status` collapsed (một vài response cũ).
 * Ưu tiên dùng {@link getRagStatusDisplay} với ragStatus nếu có.
 */
export function getDisplayFromStatus(
  status: DocumentStatus | null | undefined,
  ragStatus: DocumentRagStatus | null | undefined,
  isPublic: boolean,
): DocumentStatusDisplay {
  if (ragStatus) return getRagStatusDisplay(ragStatus, isPublic);
  switch (status) {
    case "ACTIVE":
      return isPublic
        ? { label: "Đã duyệt (công khai)", tone: "success" }
        : { label: "Riêng tư", tone: "neutral" };
    case "REJECTED":
      return { label: "Bị từ chối", tone: "error" };
    case "DELETED":
      return { label: "Đã xóa", tone: "neutral" };
    case "PENDING":
    default:
      return { label: "Chờ duyệt", tone: "warning" };
  }
}
