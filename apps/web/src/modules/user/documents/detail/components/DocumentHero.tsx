"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { APP_CONFIG } from "@/config";
import { useAuthStore } from "@/stores/auth/store";
import type { DocumentDetail } from "@/types/document.type";
import { formatDate } from "@/utils";

import {
  buildDownloadFileName,
  buildProtectedFileUrl,
  buildProtectedDownloadUrl,
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
  const accessToken = useAuthStore((state) => state.accessToken);
  const [downloading, setDownloading] = useState(false);
  const downloadUrl = buildProtectedDownloadUrl(document.id);
  const downloadFileName = buildDownloadFileName(
    document.title,
    document.format,
  );

  const handleDownload = async () => {
    if (!accessToken) {
      toast.error("Bạn cần đăng nhập để tải tài liệu");
      return;
    }

    try {
      setDownloading(true);
      const response = await fetch(`${APP_CONFIG.api.baseUrl}${downloadUrl}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Không thể tải tài liệu");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = getResponseFilename(response) ?? downloadFileName;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tải tài liệu",
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleOpen = async () => {
    if (!accessToken) {
      toast.error("Bạn cần đăng nhập để mở tài liệu");
      return;
    }

    try {
      const response = await fetch(
        `${APP_CONFIG.api.baseUrl}${buildProtectedFileUrl(document.id)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Không thể mở tài liệu");
      }

      const blob = await response.blob();
      window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể mở tài liệu",
      );
    }
  };

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
          <Button onClick={handleOpen} type="button" variant="outline">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                open_in_new
              </span>
              Mở tài liệu
            </span>
          </Button>

          <Button
            disabled={downloading}
            onClick={handleDownload}
            variant="primary"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>
              {downloading ? "Đang tải..." : "Tải xuống"}
            </span>
          </Button>

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

function getResponseFilename(response: Response): string | null {
  const disposition = response.headers.get("content-disposition");
  if (!disposition) return null;

  const encoded = disposition.match(/filename\\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);

  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  return plain ?? null;
}
