import type { FC } from "react";
export interface SkeletonProps {
  readonly lines?: number;
}

export const Skeleton: FC<SkeletonProps> = ({ lines = 2 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-surface-variant rounded animate-pulse ${
            index === 0 ? "w-3/4" : "w-1/2"
          }`}
        />
      ))}
    </div>
  );
};
