import { Button } from "@/components/ui/Button";

import { DocumentCard } from "../components/DocumentCard";
import { DocumentCarousel } from "../components/DocumentCarousel";
import { DocumentCardSkeleton } from "../components/DocumentSkeleton";
import { CommentCard } from "../components/CommentCard";
import { fetchDocuments } from "../../documents/api";

export default async function HomePage(): Promise<React.JSX.Element> {
  let documents: Awaited<ReturnType<typeof fetchDocuments>>["documents"] = [];

  try {
    const documentsResponse = await fetchDocuments({ page: 1, limit: 10 });
    documents = documentsResponse.documents ?? [];
  } catch {
    documents = [];
  }

  return (
    <div className="min-w-0 bg-background">
      {/* ================= SECTION 1 ================= */}
      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Tài liệu gần đây</h2>

          <Button variant="ghost">Xem thêm</Button>
        </div>

        <DocumentCarousel>
          {documents.length === 0
            ? Array.from({ length: 4 }).map((_, index) => (
                <DocumentCardSkeleton key={index} />
              ))
            : documents.map((doc) => (
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
                  coverImage={
                    doc.author?.avatarUrl ||
                    "https://images.unsplash.com/photo-1551288049-bebda4e38f71"
                  }
                  pageCount={1}
                />
              ))}
        </DocumentCarousel>
      </section>
      {/* ================= SECTION 2 ================= */}
      <section>
        <div className="grid grid-cols-3 gap-6">
          {/* LEFT: DISCUSSIONS */}
          <div className="col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Thảo luận gần đây</h2>

              <Button variant="ghost">Xem tất cả</Button>
            </div>

            <div className="space-y-4">
              {documents.length === 0
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-32 bg-surface-variant animate-pulse rounded-lg"
                    />
                  ))
                : documents.slice(0, 4).map((doc, index) => (
                    <CommentCard
                      key={doc.id}
                      data={{
                        id: doc.id,
                        avatarUrl: doc.author?.avatarUrl ?? "",
                        initials: doc.author?.name
                          ? doc.author.name.slice(0, 2).toUpperCase()
                          : "AH",
                        username: doc.author?.name ?? "Người dùng",
                        title: doc.subject?.name ?? "Tài liệu mới",
                        subject: doc.subject?.name ?? "Chung",
                        content: doc.title,
                        replies: index * 2 + 1,
                        likes: index * 8 + 4,
                      }}
                    />
                  ))}
            </div>
          </div>

          {/* RIGHT: TRENDING */}
          <div className="col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Xu hướng</h2>

              <Button variant="ghost">Xem thêm</Button>
            </div>

            <div className="space-y-4">
              {documents.slice(0, 2).map((doc) => (
                <DocumentCard
                  id={doc.id}
                  key={doc.id}
                  title={doc.title}
                  subtitle={doc.subject?.name ?? "Tài liệu nổi bật"}
                  coverImage={
                    doc.author?.avatarUrl ||
                    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
                  }
                  pageCount={1}
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
