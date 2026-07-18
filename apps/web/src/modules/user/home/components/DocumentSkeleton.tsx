import type { FC } from "react";

export const DocumentCardSkeleton: FC = () => {
  return (
    <div className="w-[260px] shrink-0 snap-start">
      <div className="flex flex-col gap-3">
        {/* Image area skeleton */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-outline-variant bg-surface-container">
          <div className="absolute inset-0 animate-pulse bg-surface-variant/60" />
        </div>

        {/* Text area skeleton */}
        <div className="space-y-2 px-1">
          <div className="h-4 w-full animate-pulse rounded-lg bg-surface-variant" />
          <div className="h-4 w-3/4 animate-pulse rounded-lg bg-surface-variant" />
          <div className="h-3 w-1/2 animate-pulse rounded-lg bg-surface-variant" />
        </div>
      </div>
    </div>
  );
};
