import Link from "next/link";
import type { LibraryDocument } from "@/types/document.type";
import { formatDate } from "@/utils";

interface Props {
  readonly document: LibraryDocument;
}

/**
 * Compact card for documents related by subject, shown in the detail sidebar.
 * Links to the same detail route so the user can navigate between documents
 * without returning to the library listing.
 */
export function RelatedDocumentCard({ document }: Props): React.JSX.Element {
  return (
    <Link href={`/documents/${document.id}`} className="group block">
      <div className="flex gap-3 rounded-xl border border-outline-variant/60 p-3 transition-colors hover:bg-surface-container-low">
        {/* Icon placeholder — format is not part of the list payload */}
        <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <span className="material-symbols-outlined text-xl text-primary">
            draft
          </span>
        </div>

        <div className="min-w-0 space-y-1">
          <h4 className="line-clamp-2 text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
            {document.title}
          </h4>

          <p className="text-xs text-on-surface-variant">
            {document.author.name}
          </p>

          {/* Upload date */}
          <p className="text-xs text-on-surface-variant/70">
            {formatDate(document.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
