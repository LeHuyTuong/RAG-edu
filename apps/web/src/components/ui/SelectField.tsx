"use client";

import { useState } from "react";
import type { FC } from "react";

export interface SelectFieldProps {
  readonly label?: string;
  readonly options: readonly string[];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly expanded?: boolean;
  readonly widthClassName?: string;
}

export const SelectField: FC<SelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  expanded = false,
  widthClassName = "w-full",
}) => {
  const [open, setOpen] = useState(expanded);

  const handleSelect = (option: string) => {
    onChange(option);
    if (!expanded) {
      setOpen(false);
    }
  };

  return (
    <label className="block">
      {label ? (
        <span className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">
          {label}
        </span>
      ) : null}
      <div className={`relative ${widthClassName}`}>
        <button
          className="flex w-full items-center justify-between rounded-xl border-2 border-primary bg-surface px-[11px] py-[7px] font-body-md"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {value}
          <span className="material-symbols-outlined">expand_more</span>
        </button>
        {open ? (
          <div className="absolute left-0 top-full z-10 mt-1 w-full overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-md">
            {options.map((option) => {
              const selected = option === value;

              return (
                <button
                  key={option}
                  className={`block w-full px-3 py-2 text-left font-body-md transition-colors ${
                    selected
                      ? "bg-primary text-on-primary"
                      : "text-on-surface hover:bg-surface-variant"
                  }`}
                  onClick={() => handleSelect(option)}
                  type="button"
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </label>
  );
};
