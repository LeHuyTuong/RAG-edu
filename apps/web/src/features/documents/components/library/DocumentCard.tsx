"use client";

import Link from "next/link";
import type { FC } from "react";
import type { LibraryDocument } from "@/types/document.type";

/* ── Format badge ── */

function formatBadge(ext?: string): { label: string; color: string } {
  const fmt = ext?.toLowerCase() ?? "";
  if (fmt === "pdf")
    return {
      label: "PDF",
      color:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    };
  if (fmt === "docx" || fmt === "doc")
    return {
      label: "DOCX",
      color:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    };
  return {
    label: fmt.toUpperCase() || "FILE",
    color:
      "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-700",
  };
}

/* ── RAG status badge ── */

function ragBadge(status?: string | null): { label: string; color: string } {
  switch (status) {
    case "READY":
      return {
        label: "Đã duyệt",
        color:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
      };
    case "INDEXING":
    case "PROCESSING":
    case "REINDEXING":
      return {
        label: "Đang xử lý",
        color:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
      };
    case "PENDING_REVIEW":
    case "REVIEWING":
      return {
        label: "Chờ duyệt",
        color:
          "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
      };
    case "REJECTED":
      return {
        label: "Từ chối",
        color:
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
      };
    default:
      return {
        label: "Bản nháp",
        color:
          "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-700",
      };
  }
}

/* ── File size formatter ── */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Relative date ── */

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays < 1) return "Hôm nay";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
}

interface DocumentCardProps {
  document: LibraryDocument;
}

export const DocumentCard: FC<DocumentCardProps> = ({ document }) => {
  const fmt = formatBadge(document.format);
  const rag = ragBadge(document.ragStatus);
  const aiApproved = document.aiReviewStatus === "AUTO_APPROVED";

  return (
    <Link
      href={`/documents/${document.id}`}
      className="group block focus:outline-none"
    >
      <article
        className="relative flex flex-col rounded-xl border border-outline-variant/60 bg-surface p-4 transition-all duration-300
        hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/[0.06]"
      >
        {/* ── Top bar: format + status badges ── */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${fmt.color}`}
          >
            {fmt.label}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rag.color}`}
          >
            {rag.label}
          </span>
        </div>

        {/* ── Title ── */}
        <h3 className="line-clamp-2 text-sm font-bold leading-snug tracking-tight text-on-surface transition-colors group-hover:text-primary mb-1.5">
          {document.title}
        </h3>

        {/* ── Subject badge ── */}
        {document.subject ? (
          <span className="inline-flex items-center gap-1 self-start rounded-lg bg-primary/8 px-2 py-0.5 text-[11px] font-semibold text-primary mb-2">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            {document.subject.name}
          </span>
        ) : null}

        {/* ── Metadata stats ── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-on-surface-variant/50 mb-2">
          <span>{formatSize(document.sizeInBytes)}</span>
          <span className="text-on-surface-variant/25">·</span>
          <span>{relativeDate(document.createdAt)}</span>
        </div>

        {/* ── Footer: author + action ── */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-outline-variant/40">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary uppercase">
              {document.author.name.charAt(0)}
            </span>
            <span className="text-xs text-on-surface-variant truncate">
              {document.author.name}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary/80 transition-colors group-hover:text-primary shrink-0">
            Xem chi tiết
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
      </article>
    </Link>
  );
};
