import type { FC } from "react";

export const Logo: FC = () => (
  <div className="inline-flex items-center gap-3">
    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white shadow-md shadow-primary/25">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3Z" fill="currentColor" />
        <path
          d="M4 14V18H10V14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <div className="min-w-0">
      <p className="truncate text-[15px] font-bold leading-tight tracking-tight text-on-surface">
        HisWise
      </p>
      <p className="truncate text-[11px] font-medium text-on-surface-variant/70">
        RAG-edu
      </p>
    </div>
  </div>
);
