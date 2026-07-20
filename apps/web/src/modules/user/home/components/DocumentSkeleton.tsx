import type { FC } from "react";

export const DocumentCardSkeleton: FC = () => {
  return (
    <div className="w-[280px] shrink-0 snap-start rounded-2xl border border-outline-variant/40 bg-surface p-5">
      <div className="flex flex-col gap-4">
        {/* Badge row */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 animate-pulse rounded-lg bg-surface-variant" />
          <div className="h-4 w-10 animate-pulse rounded-md bg-surface-variant" />
        </div>

        {/* Title */}
        <div className="h-5 w-full animate-pulse rounded-lg bg-surface-variant" />
        <div className="h-5 w-2/3 animate-pulse rounded-lg bg-surface-variant" />

        {/* Snippet */}
        <div className="h-4 w-full animate-pulse rounded bg-surface-variant" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-surface-variant" />

        {/* Metadata */}
        <div className="flex gap-3">
          <div className="h-3 w-16 animate-pulse rounded bg-surface-variant" />
          <div className="h-3 w-12 animate-pulse rounded bg-surface-variant" />
        </div>

        {/* Action */}
        <div className="h-4 w-24 animate-pulse rounded bg-surface-variant" />
      </div>
    </div>
  );
};
