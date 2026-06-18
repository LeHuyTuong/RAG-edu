import type { FC, ReactNode } from "react";

export interface TooltipProps {
  readonly text: string;
  readonly children: ReactNode;
}

export const Tooltip: FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-inverse-surface text-inverse-on-surface text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-inverse-surface">
        {text}
      </div>
    </div>
  );
};
