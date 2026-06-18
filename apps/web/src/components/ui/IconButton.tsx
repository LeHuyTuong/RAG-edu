"use client";

import type { ReactNode } from "react";

export interface IconButtonProps extends Readonly<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> {
  readonly icon: ReactNode;
  readonly ariaLabel: string;
}

export function IconButton({
  icon,
  ariaLabel,
  className = "",
  ...props
}: IconButtonProps): React.JSX.Element {
  return (
    <button
      aria-label={ariaLabel}
      className={`p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
