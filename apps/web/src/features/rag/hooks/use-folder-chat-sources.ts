"use client";

import { useEffect, useMemo, useState } from "react";

import { useFolderOptions, useLibraryDocuments } from "@/features/documents";
import { getErrorMessage } from "@/utils/error";

import { isDocumentReadyForAi } from "../lib/rag-sources";

export function useFolderChatSources(folderId: number) {
  const isValidFolder = Number.isFinite(folderId);
  const documentsQuery = useLibraryDocuments(
    { folderId, limit: 50, onlyMine: true, page: 1 },
    { enabled: isValidFolder },
  );
  const foldersQuery = useFolderOptions();
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const documents = useMemo(
    () => documentsQuery.data?.documents ?? [],
    [documentsQuery.data?.documents],
  );

  useEffect(() => {
    if (!isValidFolder) {
      setSelectedDocumentIds(new Set());
      return;
    }

    const readyIds = new Set(
      documents
        .filter(isDocumentReadyForAi)
        .map((document) => String(document.id)),
    );

    setSelectedDocumentIds((current) => {
      if (current.size === 0) return readyIds;

      return new Set(
        [...current].filter((documentId) => readyIds.has(documentId)),
      );
    });
  }, [documents, isValidFolder]);

  const readySourceIds = useMemo(
    () =>
      documents
        .filter(isDocumentReadyForAi)
        .filter((document) => selectedDocumentIds.has(String(document.id)))
        .map((document) => Number(document.id))
        .filter(Number.isFinite),
    [documents, selectedDocumentIds],
  );
  const folderName = foldersQuery.data?.find(
    (folder) => Number(folder.id) === folderId,
  )?.folderName;

  return {
    documents,
    folderName: folderName ?? null,
    isLoading: isValidFolder && documentsQuery.isLoading,
    error: isValidFolder
      ? documentsQuery.isError
        ? getErrorMessage(documentsQuery.error)
        : null
      : "Thư mục không hợp lệ",
    selectedDocumentIds,
    setSelectedDocumentIds,
    readySourceIds,
  };
}
