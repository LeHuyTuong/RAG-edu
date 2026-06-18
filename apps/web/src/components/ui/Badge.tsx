import type { FC, ReactNode } from "react";

export interface BadgeProps {
  readonly tone?: "success" | "warning" | "error" | "neutral";
  readonly children: ReactNode;
  readonly className?: string;
}

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  success: "bg-[#dcfce7] text-[#166534]",
  warning: "bg-[#fef08a] text-[#854d0e]",
  error: "bg-[#fee2e2] text-[#991b1b]",
  neutral: "bg-surface-variant text-on-surface-variant",
};

export const Badge: FC<BadgeProps> = ({
  tone = "neutral",
  children,
  className = "",
}) => {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
};
