"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DocumentCard } from "../components/DocumentCard";
import { DocumentCarousel } from "../components/DocumentCarousel";
import { DocumentCardSkeleton } from "../components/DocumentSkeleton";
import { fetchDocuments, fetchSubjects } from "@/apis/document.api";
import type { LibraryDocument, Subject } from "@/types/document.type";

const SUBJECT_ICONS: Record<string, string> = {
  lịch: "history_edu",
  sử: "history_edu",
  văn: "menu_book",
  toán: "function",
  lý: "science",
  hóa: "biotech",
  sinh: "psychology",
  anh: "translate",
  ngoại: "language",
  tin: "computer",
  công: "engineering",
  kinh: "finance",
  luật: "gavel",
  triết: "lightbulb",
  địa: "public",
  giáo: "school",
  y: "medical_services",
  mỹ: "palette",
  nhạc: "music_note",
};

function getSubjectIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(SUBJECT_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "auto_stories";
}

const SUBJECT_LIGHT_GRADIENTS = [
  "from-primary-container/40 to-tertiary-container/40",
  "from-secondary-container/40 to-primary-container/40",
  "from-tertiary-container/40 to-error-container/30",
  "from-primary-container/30 to-secondary-container/40",
  "from-secondary-container/40 to-tertiary-container/40",
  "from-tertiary-container/40 to-primary-container/40",
];

const SUBJECT_ICON_BG = [
  "bg-primary-container text-on-primary-container",
  "bg-secondary-container text-on-secondary-container",
  "bg-tertiary-container text-on-tertiary-container",
  "bg-primary-container text-on-primary-container",
  "bg-secondary-container text-on-secondary-container",
  "bg-tertiary-container text-on-tertiary-container",
];

function getSubjectGradient(index: number): string {
  return SUBJECT_LIGHT_GRADIENTS[index % SUBJECT_LIGHT_GRADIENTS.length]!;
}

function getSubjectIconBg(index: number): string {
  return SUBJECT_ICON_BG[index % SUBJECT_ICON_BG.length]!;
}

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

export default function HomePage(): React.JSX.Element {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [documentsResponse, subjectsResponse] = await Promise.all([
          fetchDocuments({ page: 1, limit: 15 }),
          fetchSubjects(6),
        ]);
        const publicDocs = (documentsResponse.documents ?? []).filter(
          (doc) => doc.isPublic === true,
        );
        setDocuments(publicDocs);
        setSubjects(subjectsResponse.subjects ?? []);
      } catch {
        setDocuments([]);
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const recentDocs = documents.slice(0, 5);
  const recentUpdatedDocs = [...documents]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 3);
  const hasRecentUpdated = recentUpdatedDocs.length > 0;

  const linkClass =
    "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface-variant transition-all hover:border-outline hover:bg-surface-container-high hover:text-on-surface";

  return (
    <div className="min-w-0">
      {/* Subtle background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/5" />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-tertiary/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ================= SECTION 1: RECENT DOCUMENTS ================= */}
        <section className="mb-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-[28px] font-bold tracking-tight text-on-surface">
                Tài liệu gần đây
              </h2>
              <p className="mt-1.5 text-sm font-medium text-on-surface-variant/70">
                Tiếp tục khám phá những tài liệu mới nhất từ cộng đồng
              </p>
            </div>

            <Link href="/library" className={linkClass}>
              Xem tất cả
              <span className="material-symbols-outlined text-base">
                arrow_forward
              </span>
            </Link>
          </div>

          <DocumentCarousel>
            {loading || documents.length === 0
              ? Array.from({ length: 5 }).map((_, index) => (
                  <DocumentCardSkeleton key={index} />
                ))
              : recentDocs.map((doc) => (
                  <DocumentCard
                    id={doc.id}
                    key={doc.id}
                    title={doc.title}
                    subtitle={
                      doc.subject?.name
                        ? `Môn học: ${doc.subject.name}`
                        : doc.author?.name
                          ? `Tác giả: ${doc.author.name}`
                          : "Tài liệu học tập mới"
                    }
                    coverImage={undefined}
                    pageCount={doc.pageCount ?? undefined}
                    updatedAt={doc.updatedAt}
                    subject={doc.subject?.name}
                  />
                ))}
          </DocumentCarousel>
        </section>

        {/* ================= SECTION 2: TWO-COLUMN LAYOUT ================= */}
        <section className="mb-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2.2fr_1fr]">
            {/* LEFT: EXPLORE BY SUBJECT */}
            <div>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <h2 className="text-[28px] font-bold tracking-tight text-on-surface">
                    Khám phá theo môn học
                  </h2>
                  <p className="mt-1.5 text-sm font-medium text-on-surface-variant/70">
                    Chọn môn học bạn quan tâm để tìm tài liệu phù hợp
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

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {loading || subjects.length === 0
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[104px] animate-pulse rounded-2xl border border-outline-variant bg-surface-container-low"
                      />
                    ))
                  : subjects.map((subject, i) => (
                      <Link
                        key={subject.id}
                        href={`/library?subjectId=${subject.id}`}
                        className="group relative overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low p-5 transition-all duration-300 hover:border-outline hover:bg-surface-container hover:scale-[1.02]"
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${getSubjectGradient(i)} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                        />

                        <div className="relative">
                          <span
                            className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${getSubjectIconBg(i)} transition-transform duration-300 group-hover:scale-110`}
                          >
                            <span className="material-symbols-outlined text-xl">
                              {getSubjectIcon(subject.name)}
                            </span>
                          </span>

                          <h3 className="text-sm font-semibold leading-tight text-on-surface line-clamp-1">
                            {subject.name}
                          </h3>
                          {subject.code ? (
                            <p className="mt-1 text-xs font-medium text-on-surface-variant/60 line-clamp-1">
                              {subject.code}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    ))}
              </div>
            </div>

            {/* RIGHT: RECENTLY UPDATED */}
            <div>
              <div className="mb-8">
                <h2 className="text-[28px] font-bold tracking-tight text-on-surface">
                  Mới cập nhật
                </h2>
                <p className="mt-1.5 text-sm font-medium text-on-surface-variant/70">
                  Tài liệu vừa được chỉnh sửa
                </p>
              </div>

              <div className="relative space-y-3 rounded-2xl border border-outline-variant bg-surface-container-low p-5">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3 py-1">
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-surface-variant" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 animate-pulse rounded bg-surface-variant" />
                          <div className="h-3 w-1/2 animate-pulse rounded bg-surface-variant" />
                        </div>
                      </div>
                    ))
                  : hasRecentUpdated
                    ? recentUpdatedDocs.map((doc, i) => (
                        <Link
                          key={doc.id}
                          href={`/documents/${doc.id}`}
                          className="group flex gap-3 rounded-xl px-2 py-2.5 -mx-2 transition-colors hover:bg-surface-container-high"
                        >
                          <div className="relative mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center">
                            <span
                              className={`block h-2 w-2 rounded-full ${i === 0 ? "bg-primary" : "bg-surface-variant"}`}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold leading-snug text-on-surface line-clamp-1">
                              {doc.title}
                            </h4>
                            <div className="mt-1 flex items-center gap-2 text-xs text-on-surface-variant/60">
                              {doc.subject?.name ? (
                                <span>{doc.subject.name}</span>
                              ) : null}
                              <span>·</span>
                              <span>{formatRelativeTime(doc.updatedAt)}</span>
                            </div>
                          </div>
                        </Link>
                      ))
                    : null}
              </div>

              <Link
                href="/library"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Xem tất cả tài liệu
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
