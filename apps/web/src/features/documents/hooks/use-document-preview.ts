"use client";

import { useEffect, useState } from "react";

import type { DocumentDetail } from "@/types/document.type";

import { fetchDocumentFile } from "../api/documents.api";
import { loadDocumentPreview } from "../lib/detail/document-preview";
import type { DocumentPreviewData } from "../types";

const initialPreview: DocumentPreviewData = { type: "error" };

export function useDocumentPreview(
  document: DocumentDetail | undefined,
  accessToken: string | null | undefined,
) {
  const [preview, setPreview] = useState<DocumentPreviewData>(initialPreview);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;

    if (!document || !accessToken) {
      setPreview(initialPreview);
      setIsLoadingPreview(false);
      return () => {
        active = false;
      };
    }

    const loadPreview = async () => {
      setIsLoadingPreview(true);

      try {
        const { blob } = await fetchDocumentFile(document.id, accessToken);
        const nextPreview = await loadDocumentPreview(document, blob);

        if (!active) {
          if (nextPreview.objectUrl) URL.revokeObjectURL(nextPreview.objectUrl);
          return;
        }

        objectUrl = nextPreview.objectUrl;
        setPreview(nextPreview);
      } catch {
        if (active) setPreview(initialPreview);
      } finally {
        if (active) setIsLoadingPreview(false);
      }
    };

    void loadPreview();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [accessToken, document]);

  return { preview, isLoadingPreview };
}
