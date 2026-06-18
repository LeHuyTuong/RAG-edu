"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { fetchDocumentDetail, fetchDocuments } from "@/apis/document.api";
import type { DocumentDetail, LibraryDocument } from "@/types/document.type";

import { DocumentHero } from "../components/DocumentHero";
import { DocumentPreview } from "../components/DocumentPreview";
import { FileInfoCard } from "../components/FileInfoCard";
import { RelatedDocumentCard } from "../components/RelatedDocumentCard";
import { AuthorCard } from "../components/AuthorCard";
import { loadDocumentPreview } from "../utils/document-preview";
import type { DocumentPreviewData } from "../type";

function DetailPageSkeleton(): React.JSX.Element {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8 animate-pulse">
      <div className="h-36 rounded-2xl bg-surface-variant" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="h-80 rounded-2xl bg-surface-variant" />
          <div className="h-40 rounded-2xl bg-surface-variant" />
        </div>
        <div className="space-y-6">
          <div className="h-28 rounded-2xl bg-surface-variant" />
          <div className="h-40 rounded-2xl bg-surface-variant" />
          <div className="h-32 rounded-2xl bg-surface-variant" />
        </div>
      </div>
    </main>
  );
}

function NotFoundState({ message }: { message: string }): React.JSX.Element {
  return (
    <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-32 text-center">
      <span className="material-symbols-outlined mb-4 text-6xl text-on-surface-variant/40">
        search_off
      </span>
      <h2 className="text-xl font-semibold text-on-surface">{message}</h2>
      <p className="mt-2 text-sm text-on-surface-variant">
        Tài liệu có thể đã bị xóa, chưa được duyệt, hoặc bạn không có quyền xem.
      </p>
    </main>
  );
}

export default function DocumentDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [preview, setPreview] = useState<DocumentPreviewData | null>(null);
  const [relatedDocuments, setRelatedDocuments] = useState<LibraryDocument[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const doc = await fetchDocumentDetail(id);
        setDocument(doc);
        setRelatedDocuments([]);

        if (doc.subject?.id) {
          try {
            const relatedResponse = await fetchDocuments({
              subjectId: doc.subject.id,
              limit: 4,
            });

            const filtered = relatedResponse.documents
              .filter((d) => d.id !== id)
              .slice(0, 3);

            setRelatedDocuments(filtered);
          } catch (relatedError) {
            console.error("Could not load related documents", relatedError);
          }
        }

        try {
          setPreview(await loadDocumentPreview(doc));
        } catch (previewError) {
          console.error("Could not load document preview", previewError);
          setPreview(null);
        }
      } catch {
        setError("Không thể tải tài liệu. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (isLoading) return <DetailPageSkeleton />;

  if (error || !document) {
    return <NotFoundState message={error ?? "Tài liệu không tồn tại."} />;
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <DocumentHero document={document} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <DocumentPreview preview={preview ?? { type: "unsupported" }} />

          {document.description ? (
            <Card className="space-y-5 p-6">
              <h2 className="text-xl font-semibold">Mô tả tài liệu</h2>
              <p className="whitespace-pre-line leading-7 text-on-surface-variant">
                {document.description}
              </p>
              {document.subject ? (
                <div className="flex flex-wrap gap-2">
                  <Badge tone="neutral">#{document.subject.code}</Badge>
                  <Badge tone="neutral">
                    #{document.subject.name.replace(/\s+/g, "")}
                  </Badge>
                </div>
              ) : null}
            </Card>
          ) : null}

          <Card className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Thảo luận</h2>
              <Badge tone="neutral">Sắp ra mắt</Badge>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Bình luận của bạn</span>
              <textarea
                placeholder="Viết bình luận của bạn..."
                disabled
                className="
                  min-h-30 w-full rounded-xl border border-outline
                  bg-surface p-4 outline-none transition-colors
                  disabled:cursor-not-allowed disabled:opacity-50
                "
              />
            </label>

            <div className="flex justify-end">
              <Button disabled>Gửi bình luận</Button>
            </div>

            <p className="text-center text-sm text-on-surface-variant">
              Chức năng bình luận đang được phát triển.
            </p>
          </Card>
        </div>

        <aside className="space-y-6">
          <FileInfoCard
            format={document.format}
            sizeInBytes={document.sizeInBytes}
          />

          <Card className="space-y-4 p-5">
            <h3 className="text-lg font-semibold">Tài liệu liên quan</h3>

            {relatedDocuments.length > 0 ? (
              <div className="space-y-3">
                {relatedDocuments.map((relatedDoc) => (
                  <RelatedDocumentCard
                    key={relatedDoc.id}
                    document={relatedDoc}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">
                {document.subject
                  ? "Chưa có tài liệu liên quan trong cùng môn học."
                  : "Tài liệu này chưa được gắn môn học."}
              </p>
            )}

            {relatedDocuments.length > 0 ? (
              <Button variant="ghost" className="w-full" type="button">
                Xem thêm tài liệu tương tự
              </Button>
            ) : null}
          </Card>

          <AuthorCard author={document.author} />
        </aside>
      </div>
    </main>
  );
}
