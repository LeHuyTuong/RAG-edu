"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/features/auth";

import { AuthorCard } from "../components/detail/AuthorCard";
import { DocumentHero } from "../components/detail/DocumentHero";
import { DocumentPreview } from "../components/detail/DocumentPreview";
import { FileInfoCard } from "../components/detail/FileInfoCard";
import { RelatedDocumentCard } from "../components/detail/RelatedDocumentCard";
import { ShareCard } from "../components/detail/ShareCard";
import { useDocumentDetail } from "../hooks/use-document-detail";
import { useDocumentPreview } from "../hooks/use-document-preview";
import { useLibraryDocuments } from "../hooks/use-library-documents";

function DetailPageSkeleton(): React.JSX.Element {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8 animate-pulse">
      <div className="h-36 rounded-2xl bg-surface-variant" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
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

function AccessDeniedState(): React.JSX.Element {
  return (
    <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-32 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-error-container/30 mb-6">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-error"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-on-surface">
        Không có quyền truy cập
      </h2>
      <p className="mt-3 max-w-md text-sm text-on-surface-variant leading-relaxed">
        Tài liệu này là riêng tư hoặc không tồn tại trên hệ thống.
      </p>
      <Link href="/library" className="mt-8">
        <Button>Quay lại Thư viện</Button>
      </Link>
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
  const { user: currentUser, accessToken } = useAuth();
  const documentQuery = useDocumentDetail(id);
  const document = documentQuery.data;
  const { preview } = useDocumentPreview(document, accessToken);
  const relatedQuery = useLibraryDocuments(
    { subjectId: document?.subject?.id ?? "", limit: 4 },
    { enabled: Boolean(document?.subject?.id) },
  );
  const relatedDocuments = (relatedQuery.data?.documents ?? [])
    .filter((relatedDocument) => {
      if (relatedDocument.id === document?.id) return false;
      const isOwner =
        currentUser?.id != null &&
        String(relatedDocument.ownerId) === String(currentUser.id);
      return relatedDocument.isPublic || isOwner;
    })
    .slice(0, 3);
  const accessDenied =
    documentQuery.isError &&
    axios.isAxiosError(documentQuery.error) &&
    (documentQuery.error.response?.status === 403 ||
      documentQuery.error.response?.status === 404);

  if (accessDenied) return <AccessDeniedState />;

  if (documentQuery.isLoading) return <DetailPageSkeleton />;

  if (documentQuery.isError || !document) {
    return (
      <NotFoundState message="Không thể tải tài liệu. Vui lòng thử lại." />
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <DocumentHero document={document} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <DocumentPreview preview={preview} />

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
        </div>

        <aside className="space-y-6">
          <FileInfoCard
            format={document.format}
            sizeInBytes={document.sizeInBytes}
            originalAuthor={document.originalAuthor}
          />

          {currentUser?.id === String(document.ownerId) && (
            <ShareCard document={document} />
          )}

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
          </Card>

          <AuthorCard author={document.author} />
        </aside>
      </div>
    </main>
  );
}
