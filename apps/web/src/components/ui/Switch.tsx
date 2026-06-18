"use client";

import type { FC } from "react";

export interface SwitchProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

export const Switch: FC<SwitchProps> = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full relative transition-colors ${
        checked ? "bg-primary" : "bg-surface-variant border border-outline"
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full absolute top-[3px] transition-all ${
          checked ? "bg-surface right-1" : "bg-outline left-1"
        }`}
      />
    </button>
  );
};
