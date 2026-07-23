"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth";
import type { DocumentDetail } from "@/types/document.type";

import { fetchDocumentFile } from "../api/documents.api";
import { buildDownloadFileName } from "../lib/detail/document-download";

export function useDocumentFileActions(document: DocumentDetail) {
  const { accessToken } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const download = useCallback(async () => {
    if (!accessToken) {
      toast.error("Bạn cần đăng nhập để tải tài liệu");
      return;
    }

    try {
      setIsDownloading(true);
      const { blob, filename } = await fetchDocumentFile(
        document.id,
        accessToken,
        "download",
      );
      const objectUrl = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = objectUrl;
      anchor.download =
        filename ?? buildDownloadFileName(document.title, document.format);
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tải tài liệu",
      );
    } finally {
      setIsDownloading(false);
    }
  }, [accessToken, document.format, document.id, document.title]);

  const open = useCallback(async () => {
    if (!accessToken) {
      toast.error("Bạn cần đăng nhập để mở tài liệu");
      return;
    }

    try {
      const { blob } = await fetchDocumentFile(document.id, accessToken);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể mở tài liệu",
      );
    }
  }, [accessToken, document.id]);

  return { download, open, isDownloading };
}
