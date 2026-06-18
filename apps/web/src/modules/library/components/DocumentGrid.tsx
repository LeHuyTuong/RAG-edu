import type { FC } from "react";
import { DocumentCard } from "./DocumentCard";
import { DocumentCardSkeleton } from "./DocumentCardSkeleton";
import type { LibraryDocument } from "@/types/document.type";

interface DocumentGridProps {
  documents: LibraryDocument[];
  isLoading: boolean;
  error: string | null;
}

const SKELETON_COUNT = 9;

/** Responsive 3-column (xl) / 2-column (md) / 1-column grid of document cards */
export const DocumentGrid: FC<DocumentGridProps> = ({
  documents,
  isLoading,
  error,
}) => {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-error/30 bg-error-container/30 py-16 text-center">
        <span className="material-symbols-outlined mb-3 text-4xl text-error">
          error_outline
        </span>
        <p className="text-sm font-medium text-error">{error}</p>
      </div>
    );
  }

  if (!isLoading && documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-outline-variant bg-surface-container-lowest py-16 text-center">
        <span className="material-symbols-outlined mb-3 text-4xl text-on-surface-variant/50">
          search_off
        </span>
        <p className="text-sm text-on-surface-variant">
          Không tìm thấy tài liệu phù hợp.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {isLoading
        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <DocumentCardSkeleton key={i} />
          ))
        : documents.map((doc) => <DocumentCard key={doc.id} document={doc} />)}
    </div>
  );
};
