import type { FC } from "react";

/** Pulse skeleton that mirrors the new clean DocumentCard layout */
export const DocumentCardSkeleton: FC = () => {
  return (
    <div className="flex flex-col rounded-xl border border-outline-variant/60 bg-surface p-5 animate-pulse">
      {/* Top badge row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="h-5 w-10 rounded-md bg-surface-variant" />
        <div className="h-5 w-16 rounded-full bg-surface-variant" />
      </div>

      {/* Title */}
      <div className="h-4 w-full rounded bg-surface-variant mb-1.5" />
      <div className="h-4 w-2/3 rounded bg-surface-variant mb-2" />

      {/* Subject badge */}
      <div className="h-5 w-20 rounded-lg bg-surface-variant mb-3" />

      {/* Stats */}
      <div className="flex gap-3 mb-3">
        <div className="h-3 w-14 rounded bg-surface-variant" />
        <div className="h-3 w-16 rounded bg-surface-variant" />
        <div className="h-3 w-12 rounded bg-surface-variant" />
      </div>

      {/* Divider */}
      <div className="border-t border-outline-variant/30 pt-3 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-surface-variant" />
            <div className="h-3 w-20 rounded bg-surface-variant" />
          </div>
          <div className="h-3 w-20 rounded bg-surface-variant" />
        </div>
      </div>
    </div>
  );
};
