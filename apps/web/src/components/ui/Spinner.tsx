import type { FC } from "react";
export interface SpinnerProps {
  readonly size?: "sm" | "md";
}

const sizeClasses: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "w-6 h-6 border-2",
  md: "w-8 h-8 border-4",
};

export const Spinner: FC<SpinnerProps> = ({ size = "md" }) => {
  return (
    <div
      className={`${sizeClasses[size]} border-outline-variant border-t-primary rounded-full animate-spin`}
    />
  );
};
