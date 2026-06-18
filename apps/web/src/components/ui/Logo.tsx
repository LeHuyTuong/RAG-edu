import type { FC } from "react";

export const Logo: FC = () => (
  <div className="inline-flex items-center gap-3">
    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/25">
      <span className="font-black text-lg leading-none">A</span>
    </div>
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-primary">
        AcademiShare
      </p>
      <p className="truncate text-[12px] text-on-surface-variant">
        AI Study Hub
      </p>
    </div>
  </div>
);
