"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode, ButtonHTMLAttributes } from "react";

export interface BackButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "className"
> {
  readonly label?: string;
  readonly fallbackHref?: string;
  readonly icon?: ReactNode;
  readonly className?: string;
  readonly mode?: "back" | "home";
  readonly onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function BackButton({
  label = "Quay lại",
  fallbackHref = "/",
  icon = <span aria-hidden="true">←</span>,
  className = "",
  mode = "back",
  onClick,
  ...props
}: BackButtonProps): React.JSX.Element {
  const router = useRouter();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (mode === "home") {
      router.push(fallbackHref);
      return;
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 ${className}`}
      onClick={handleClick}
      {...(props as any)}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
