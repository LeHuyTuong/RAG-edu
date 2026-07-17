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
        className={`w-4 h-4 rounded-full absolute top-[3px] left-0 transition-transform duration-300 ${
          checked ? "bg-surface translate-x-7" : "bg-outline translate-x-1"
        }`}
      />
    </button>
  );
};
