"use client";

import Link from "next/link";

import { DocumentCard } from "../components/DocumentCard";
import { DocumentCarousel } from "../components/DocumentCarousel";
import { DocumentCardSkeleton } from "../components/DocumentSkeleton";
import { useLibraryDocuments, useSubjects } from "@/features/documents";

/**
 * FLOW DOC: apps/web/docs/FRONTEND-CODE-FLOW-VI.md#flow-documents
 * Home là module tổng hợp: dùng query của documents feature để lấy tài liệu
 * công khai/chủ đề thật rồi biến đổi thành các section hiển thị.
 */

/* ── Relative time ── */

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
  });
}

/* ── RAG status badge ── */

function ragStatusLabel(status?: string | null): {
  label: string;
  color: string;
} {
  switch (status) {
    case "READY":
      return {
        label: "Đã duyệt",
        color:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
      };
    case "INDEXING":
    case "REINDEXING":
      return {
        label: "Đang AI xử lý",
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

export default function HomePage(): React.JSX.Element {
  const documentsQuery = useLibraryDocuments({ page: 1, limit: 15 });
  const subjectsQuery = useSubjects(100);
  const documents = (documentsQuery.data?.documents ?? []).filter(
    (doc) => doc.isPublic === true,
  );
  const subjects = subjectsQuery.data?.subjects ?? [];

  const featuredDocs = documents.slice(0, 6);
  const recentUpdatedDocs = [...documents]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);
  const hasRecentUpdated = recentUpdatedDocs.length > 0;
  const subjectColors = [
    "from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-800/40",
    "from-sky-50 to-cyan-50 border-sky-200 dark:from-sky-950/30 dark:to-cyan-950/30 dark:border-sky-800/40",
    "from-violet-50 to-purple-50 border-violet-200 dark:from-violet-950/30 dark:to-purple-950/30 dark:border-violet-800/40",
    "from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-800/40",
    "from-rose-50 to-pink-50 border-rose-200 dark:from-rose-950/30 dark:to-pink-950/30 dark:border-rose-800/40",
    "from-teal-50 to-emerald-50 border-teal-200 dark:from-teal-950/30 dark:to-emerald-950/30 dark:border-teal-800/40",
  ];
  const subjectIcons = [
    "account_balance",
    "castle",
    "history_edu",
    "menu_book",
    "flag",
    "trending_up",
  ];

  const linkClass =
    "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface px-3.5 py-2 text-sm font-medium text-on-surface-variant transition-all duration-200 hover:border-primary/30 hover:text-primary hover:shadow-sm";

  return (
    <div className="min-w-0">
      {/* Subtle background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-primary/[0.03] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ══════ SECTION 1: FEATURED HISTORICAL DOCUMENTS ══════ */}
        <section className="mb-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-[26px] font-bold tracking-tight text-on-surface">
                Tư liệu lịch sử tiêu biểu
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant/60">
                Khám phá những tài liệu lịch sử nổi bật từ kho lưu trữ
              </p>
            </div>
            <Link href="/library" className={linkClass}>
              Khám phá thêm
              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
            </Link>
          </div>

          <DocumentCarousel>
            {documentsQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <DocumentCardSkeleton key={index} />
              ))
            ) : featuredDocs.length > 0 ? (
              featuredDocs.map((doc) => (
                <DocumentCard
                  id={doc.id}
                  key={doc.id}
                  title={doc.title}
                  description={doc.description}
                  format={doc.format}
                  sizeInBytes={doc.sizeInBytes}
                  pageCount={doc.pageCount ?? undefined}
                  authorName={doc.author?.name}
                  updatedAt={doc.updatedAt}
                  period={doc.subject?.name}
                />
              ))
            ) : (
              <div className="flex min-h-[244px] w-full items-center justify-center rounded-2xl border border-dashed border-outline-variant/70 bg-surface-container-low px-6 text-center text-sm text-on-surface-variant/60">
                {documentsQuery.isError
                  ? "Không thể tải tài liệu nổi bật lúc này."
                  : "Chưa có tài liệu công khai để hiển thị."}
              </div>
            )}
          </DocumentCarousel>
        </section>

        {/* ══════ SECTION 2: TWO-COLUMN ══════ */}
        <section className="mb-14">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2.2fr_1fr]">
            {/* ── LEFT: Explore by subject ── */}
            <div>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="text-[26px] font-bold tracking-tight text-on-surface">
                    Khám phá theo chủ đề
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant/60">
                    Chọn một chủ đề đang có trong hệ thống để khám phá tư liệu
                  </p>
                </div>
                <Link
                  href="/library"
                  className={`hidden sm:inline-flex ${linkClass}`}
                >
                  Xem tất cả
                  <span className="material-symbols-outlined text-base">
                    arrow_forward
                  </span>
                </Link>
              </div>

              {/* Subject cards grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {subjectsQuery.isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[104px] animate-pulse rounded-xl border border-outline-variant bg-surface-container-low"
                    />
                  ))
                ) : subjects.length > 0 ? (
                  subjects.map((subject, i) => (
                    <Link
                      key={subject.id}
                      href={`/library?subjectId=${encodeURIComponent(subject.id)}`}
                      className={`group relative flex h-[104px] flex-col overflow-hidden rounded-xl border bg-gradient-to-br
                          ${subjectColors[i % subjectColors.length]}
                          px-4 py-4 transition-all duration-300
                          hover:-translate-y-1 hover:shadow-md hover:border-primary/40
                        `}
                    >
                      {/* Icon */}
                      <span className="material-symbols-outlined text-xl text-primary/70 mb-2 block transition-transform duration-300 group-hover:scale-110 group-hover:text-primary">
                        {subjectIcons[i % subjectIcons.length]}
                      </span>

                      <h3 className="min-h-[2.25rem] line-clamp-2 text-sm font-bold leading-tight text-on-surface">
                        {subject.name}
                      </h3>
                      <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-on-surface-variant/50">
                        Mã chủ đề: {subject.code}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full rounded-xl border border-dashed border-outline-variant/70 bg-surface-container-low px-4 py-6 text-center text-sm text-on-surface-variant/60">
                    {subjectsQuery.isError
                      ? "Không thể tải danh sách chủ đề lúc này."
                      : "Chưa có chủ đề nào trong hệ thống."}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Recently updated ── */}
            <div>
              <div className="mb-6">
                <h2 className="text-[26px] font-bold tracking-tight text-on-surface">
                  Mới cập nhật
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant/60">
                  Tư liệu vừa được bổ sung hoặc chỉnh sửa
                </p>
              </div>

              <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-low/50 p-5">
                {documentsQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3 py-2">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-surface-variant" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-surface-variant" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-surface-variant" />
                      </div>
                    </div>
                  ))
                ) : hasRecentUpdated ? (
                  recentUpdatedDocs.map((doc, i) => (
                    <Link
                      key={doc.id}
                      href={`/documents/${doc.id}`}
                      className="group flex items-start gap-3 rounded-xl px-2.5 py-2.5 -mx-2.5 transition-colors hover:bg-surface-container-high"
                    >
                      {/* Status dot */}
                      <div className="relative mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center">
                        <span
                          className={`block h-2 w-2 rounded-full ${
                            i === 0
                              ? "bg-primary animate-pulse"
                              : "bg-surface-variant"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold leading-snug text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                          {doc.title}
                        </h4>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-on-surface-variant/50">
                          {doc.subject?.name ? (
                            <span>{doc.subject.name}</span>
                          ) : null}
                          <span>·</span>
                          <span>{formatRelativeTime(doc.updatedAt)}</span>
                          {doc.ragStatus ? (
                            <>
                              <span>·</span>
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                  ragStatusLabel(doc.ragStatus).color
                                }`}
                              >
                                {ragStatusLabel(doc.ragStatus).label}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant/50 text-center py-6">
                    Chưa có tư liệu nào được cập nhật
                  </p>
                )}
              </div>

              <Link
                href="/library"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Xem tất cả tư liệu
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
