import Link from "next/link";

import { DocumentCard } from "../components/DocumentCard";
import { DocumentCarousel } from "../components/DocumentCarousel";
import { DocumentCardSkeleton } from "../components/DocumentSkeleton";
import { fetchDocuments, fetchSubjects } from "@/apis/document.api";
import type { Subject } from "@/types/document.type";

export default async function HomePage(): Promise<React.JSX.Element> {
  let documents: Awaited<ReturnType<typeof fetchDocuments>>["documents"] = [];
  let subjects: Subject[] = [];

  try {
    const [documentsResponse, subjectsResponse] = await Promise.all([
      fetchDocuments({ page: 1, limit: 10 }),
      fetchSubjects(6),
    ]);
    documents = documentsResponse.documents ?? [];
    subjects = subjectsResponse.subjects ?? [];
  } catch {
    documents = [];
    subjects = [];
  }

  const recentDocs = documents.slice(0, 4);
  const recentUpdatedDocs = documents.slice(4, 7);

  const linkClass =
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent px-2.5 py-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-variant";

  return (
    <div className="min-w-0 bg-background">
      {/* ================= SECTION 1 ================= */}
      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Tài liệu gần đây</h2>

          <Link href="/library" className={linkClass}>
            Xem thêm
          </Link>
        </div>

        <DocumentCarousel>
          {documents.length === 0
            ? Array.from({ length: 4 }).map((_, index) => (
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
                  coverImage={doc.author?.avatarUrl ?? undefined}
                  pageCount={doc.pageCount ?? undefined}
                />
              ))}
        </DocumentCarousel>
      </section>
      {/* ================= SECTION 2 ================= */}
      <section>
        <div className="grid grid-cols-3 gap-6">
          {/* LEFT: SUBJECTS */}
          <div className="col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Khám phá theo môn học</h2>

              <Link href="/library" className={linkClass}>
                Xem tất cả
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {subjects.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 bg-surface-variant animate-pulse rounded-lg"
                    />
                  ))
                : subjects.map((subject) => (
                    <Link
                      key={subject.id}
                      href={`/library?subjectId=${subject.id}`}
                      className="block p-4 bg-surface-variant rounded-xl hover:bg-surface-hover transition-colors"
                    >
                      <h3 className="font-semibold text-on-surface line-clamp-1">
                        {subject.name}
                      </h3>
                      <p className="mt-1 text-sm text-on-surface-variant line-clamp-1">
                        Khám phá tài liệu môn học này
                      </p>
                    </Link>
                  ))}
            </div>
          </div>

          {/* RIGHT: RECENTLY UPDATED */}
          <div className="col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Mới cập nhật</h2>

              <Link href="/library" className={linkClass}>
                Xem thêm
              </Link>
            </div>

            <div className="space-y-4">
              {recentUpdatedDocs.length === 0
                ? Array.from({ length: 2 }).map((_, i) => (
                    <DocumentCardSkeleton key={i} />
                  ))
                : recentUpdatedDocs.map((doc) => (
                    <DocumentCard
                      id={doc.id}
                      key={doc.id}
                      title={doc.title}
                      subtitle={doc.subject?.name ?? "Tài liệu mới cập nhật"}
                      coverImage={doc.author?.avatarUrl ?? undefined}
                      pageCount={doc.pageCount ?? undefined}
                      className="max-w-full"
                    />
                  ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
