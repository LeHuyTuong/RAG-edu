"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchSharedDocument } from "@/apis/document.api";
import type { DocumentDetail } from "@/types/document.type";

function SharedDocumentSkeleton(): React.JSX.Element {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-12 animate-pulse">
      <div className="h-10 w-2/3 rounded-xl bg-surface-variant" />
      <div className="h-5 w-1/3 rounded-xl bg-surface-variant" />
      <div className="h-96 rounded-2xl bg-surface-variant" />
    </main>
  );
}

export default function SharedDocumentPage(): React.JSX.Element {
  const { token } = useParams<{ token: string }>();
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetchSharedDocument(token)
      .then((doc) => setDocument(doc))
      .catch(() =>
        setError("Tài liệu không tồn tại hoặc link chia sẻ đã bị thu hồi."),
      )
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <SharedDocumentSkeleton />;

  if (error || !document) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col items-center justify-center px-6 py-32 text-center">
        <span className="material-symbols-outlined mb-4 text-6xl text-on-surface-variant/40">
          link_off
        </span>
        <h2 className="text-xl font-semibold text-on-surface">
          {error ?? "Tài liệu không tồn tại."}
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Link chia sẻ có thể đã bị thu hồi hoặc không hợp lệ.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">{document.title}</h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-on-surface-variant">
          {document.author?.name && (
            <span>Được chia sẻ bởi {document.author.name}</span>
          )}
          {document.subject && (
            <Badge tone="neutral">{document.subject.name}</Badge>
          )}
        </div>
      </div>

      {document.description && (
        <Card className="p-6">
          <h2 className="mb-3 text-lg font-semibold">Mô tả</h2>
          <p className="whitespace-pre-line leading-7 text-on-surface-variant">
            {document.description}
          </p>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between bg-surface-variant px-6 py-4">
          <span className="text-sm font-medium text-on-surface">
            Xem tài liệu
          </span>
          {document.fileUrl && (
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>
              Tải xuống
            </a>
          )}
        </div>

        {document.fileUrl && (
          <div className="p-4">
            {document.format === "pdf" ? (
              <iframe
                src={`${document.fileUrl}#toolbar=0`}
                className="h-[600px] w-full rounded-xl border border-outline"
                title={document.title}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 py-16 text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl">
                  description
                </span>
                <p>Xem trước không khả dụng cho định dạng này.</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </main>
  );
}
