import { Skeleton } from "@/components/ui/Skeleton";
import type { FC } from "react";

export const DocumentCardSkeleton: FC = () => {
  return (
    <div className="w-full max-w-[320px] shrink-0">
      <div className="flex h-[420px] flex-col">
        {/* image area */}
        <div className="relative flex-[2] overflow-hidden rounded-2xl bg-surface-variant animate-pulse" />

        {/* text area */}
        <div className="flex flex-[1] flex-col justify-center px-1 pt-3 space-y-2">
          <Skeleton lines={2} />
        </div>
      </div>
    </div>
  );
};
