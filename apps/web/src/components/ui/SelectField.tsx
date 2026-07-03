"use client";

import { useState } from "react";
import type { FC } from "react";

export interface SelectFieldOption {
  readonly label: string;
  readonly value: string;
}

export interface SelectFieldProps {
  readonly label?: string;
  readonly options: readonly (string | SelectFieldOption)[];
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly expanded?: boolean;
  readonly widthClassName?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
}

export const SelectField: FC<SelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  expanded = false,
  widthClassName = "w-full",
  placeholder,
  disabled = false,
}) => {
  const [open, setOpen] = useState(expanded);

  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  );
  const selected = normalizedOptions.find((option) => option.value === value);
  const displayValue = selected?.label ?? placeholder ?? value;

  const handleSelect = (option: SelectFieldOption) => {
    onChange(option.value);
    if (!expanded) {
      setOpen(false);
    }
  };

  return (
    <label className="block min-w-0">
      {label ? (
        <span className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">
          {label}
        </span>
      ) : null}
      <div className={`relative min-w-0 ${widthClassName}`}>
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={label}
          className="flex w-full min-w-0 items-center justify-between gap-2 whitespace-nowrap rounded-xl border border-outline bg-surface px-3 py-2 text-left font-body-md text-on-surface outline-none transition-colors hover:border-primary focus:border-2 focus:border-primary focus:px-[11px] focus:py-[7px] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <span className="min-w-0 truncate">{displayValue}</span>
          <span className="material-symbols-outlined shrink-0">
            expand_more
          </span>
        </button>
        {open ? (
          <div
            className="absolute left-0 top-full z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-md"
            role="listbox"
          >
            {normalizedOptions.map((option) => {
              const optionSelected = option.value === value;

              return (
                <button
                  aria-selected={optionSelected}
                  key={option.value}
                  className={`block w-full px-3 py-2 text-left font-body-md transition-colors ${
                    optionSelected
                      ? "bg-primary text-on-primary"
                      : "text-on-surface hover:bg-surface-container-high"
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option)}
                  role="option"
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </label>
  );
};
