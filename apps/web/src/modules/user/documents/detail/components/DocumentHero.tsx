import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { DocumentDetail } from "@/types/document.type";
import { formatDate } from "@/utils";

import {
  buildCloudinaryDownloadUrl,
  buildDownloadFileName,
} from "../utils/document-download";

interface Props {
  readonly document: DocumentDetail;
}

/**
 * Page hero for the document detail view.
 * Renders the document title, author row, subject badge, upload date,
 * and action buttons (Open document / Download / Save).
 */
export function DocumentHero({ document }: Props): React.JSX.Element {
  const downloadUrl = buildCloudinaryDownloadUrl(document.fileUrl);
  const downloadFileName = buildDownloadFileName(
    document.title,
    document.format,
  );

  const avatarContent = document.author.avatarUrl ? (
    <img
      src={document.author.avatarUrl}
      alt={document.author.name}
      className="h-full w-full rounded-full object-cover"
    />
  ) : (
    <span className="text-sm font-semibold text-white">
      {document.author.name.charAt(0).toUpperCase()}
    </span>
  );

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-on-surface">
            {document.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
                {avatarContent}
              </div>
              <div>
                <p className="font-medium text-on-surface">
                  {document.author.name}
                </p>
                <p className="text-xs">{document.author.email}</p>
              </div>
            </div>

            {document.subject ? (
              <Badge tone="neutral">{document.subject.name}</Badge>
            ) : null}

            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                calendar_today
              </span>
              {formatDate(document.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3">
          <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  open_in_new
                </span>
                Mở tài liệu
              </span>
            </Button>
          </a>

          <a href={downloadUrl} download={downloadFileName}>
            <Button variant="primary">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  download
                </span>
                Tải xuống
              </span>
            </Button>
          </a>

          <Button variant="outline">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                bookmark
              </span>
              Lưu lại
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}
