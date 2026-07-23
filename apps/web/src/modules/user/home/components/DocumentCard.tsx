"use client";

import Link from "next/link";
import type { FC } from "react";

interface DocumentCardProps {
  id: string;
  title: string;
  /** Description / snippet — reserves space to keep cards aligned */
  description?: string | null;
  format?: string;
  sizeInBytes?: number;
  pageCount?: number;
  period?: string;
  authorName?: string;
  updatedAt?: string;
  className?: string;
}

function formatLabel(ext?: string): { label: string; color: string } {
  switch (ext?.toLowerCase()) {
    case "pdf":
      return {
        label: "PDF",
        color:
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
      };
    case "doc":
    case "docx":
      return {
        label: "DOCX",
        color:
          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
      };
    default:
      return {
        label: ext?.toUpperCase() ?? "FILE",
        color:
          "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-700",
      };
  }
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays < 1) return "Hôm nay";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DocumentCard: FC<DocumentCardProps> = ({
  id,
  title,
  description,
  format,
  sizeInBytes,
  pageCount,
  period,
  authorName,
  updatedAt,
  className = "",
}) => {
  const fmt = formatLabel(format);
  const time = updatedAt ? timeAgo(updatedAt) : null;
  const size = sizeInBytes ? formatSize(sizeInBytes) : null;
  const hasDescription = !!description?.trim();

  return (
    <Link
      href={`/documents/${id}`}
      className={`block h-[244px] w-[280px] shrink-0 snap-start ${className}`}
    >
      <div
        className="group flex h-full cursor-pointer select-none flex-col gap-3.5 rounded-2xl border border-outline-variant/60 bg-surface p-5 transition-all duration-300 ease-out
          hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/[0.06]
        "
      >
        {/* ── Top row: subject badge + format badge ── */}
        <div className="flex items-center justify-between gap-2">
          {period ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary">
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
              <span className="line-clamp-2">{period}</span>
            </span>
          ) : null}
          {format ? (
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${fmt.color}`}
            >
              {fmt.label}
            </span>
          ) : null}
        </div>

        {/* ── Title ── */}
        <h3 className="min-h-[2.75rem] line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-on-surface transition-colors group-hover:text-primary">
          {title}
        </h3>

        {/* ── Description snippet (conditional) ── */}
        <p className="min-h-[2.75rem] line-clamp-2 text-sm leading-relaxed text-on-surface-variant/70">
          {hasDescription ? description : null}
        </p>

        {/* ── Metadata row ── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant/50">
          {size ? (
            <>
              <span>{size}</span>
              <span className="text-on-surface-variant/25">·</span>
            </>
          ) : null}
          {pageCount !== undefined ? (
            <>
              <span className="inline-flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {pageCount} trang
              </span>
              <span className="text-on-surface-variant/25">·</span>
            </>
          ) : null}
          {time ? <span>{time}</span> : null}
        </div>

        {/* ── Footer: author + action ── */}
        <div className="mt-auto flex items-center justify-between w-full gap-2 pt-2 border-t border-outline-variant/40">
          {authorName ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary uppercase">
                {authorName.charAt(0)}
              </span>
              <span className="text-xs text-on-surface-variant truncate">
                {authorName}
              </span>
            </div>
          ) : null}

          <span className="inline-flex items-center gap-1 ml-auto text-xs font-semibold text-primary/80 transition-colors group-hover:text-primary shrink-0">
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
      </div>
    </Link>
  );
};
