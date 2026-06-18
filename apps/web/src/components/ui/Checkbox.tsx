"use client";

import type { FC } from "react";

export interface CheckboxProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

export const Checkbox: FC<CheckboxProps> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className="w-4 h-4 text-primary border-outline rounded-md focus:ring-primary"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="font-body-md text-body-md text-on-surface">{label}</span>
    </label>
  );
};
