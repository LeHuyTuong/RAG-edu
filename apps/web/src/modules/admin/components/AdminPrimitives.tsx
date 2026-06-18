"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminTone } from "../types";

const toneClasses: Record<AdminTone, string> = {
  primary: "bg-primary-fixed text-on-primary-fixed-variant",
  secondary: "bg-secondary-fixed text-on-secondary-fixed-variant",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  error: "bg-error-container text-on-error-container",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

export function MaterialIcon({
  name,
  className = "",
  filled = false,
}: {
  readonly name: string;
  readonly className?: string;
  readonly filled?: boolean;
}): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: '"FILL" 1' } : undefined}
    >
      {name}
    </span>
  );
}

export function AdminCard({
  children,
  className = "",
}: {
  readonly children: ReactNode;
  readonly className?: string;
}): React.JSX.Element {
  return (
    <section
      className={`rounded-lg border border-outline-variant bg-surface-container-lowest ${className}`}
    >
      {children}
    </section>
  );
}

export function AdminToneIcon({
  icon,
  tone = "neutral",
}: {
  readonly icon: string;
  readonly tone?: AdminTone;
}): React.JSX.Element {
  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded ${toneClasses[tone]}`}
    >
      <MaterialIcon name={icon} />
    </span>
  );
}

export function AdminIconAction({
  label,
  icon,
  tone = "neutral",
  onClick,
  href,
}: {
  readonly label: string;
  readonly icon: string;
  readonly tone?: AdminTone;
  readonly onClick?: () => void;
  readonly href?: string;
}): React.JSX.Element {
  const className =
    tone === "primary"
      ? "text-primary hover:bg-primary/10"
      : tone === "error"
        ? "text-error hover:bg-error/10"
        : tone === "tertiary"
          ? "text-tertiary hover:bg-tertiary/10"
          : "text-on-surface-variant hover:bg-surface-container-high";

  if (href) {
    return (
      <Link
        aria-label={label}
        className={`inline-flex h-9 w-9 items-center justify-center rounded transition-colors ${className}`}
        href={href}
        title={label}
      >
        <MaterialIcon name={icon} />
      </Link>
    );
  }

  return (
    <button
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded transition-colors ${className}`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <MaterialIcon name={icon} />
    </button>
  );
}

export interface AdminSelectOption<T extends string> {
  readonly label: string;
  readonly value: T;
}

export function AdminSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  readonly label: string;
  readonly options: readonly AdminSelectOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <label className="relative block">
      <span className="mb-1 block font-label-sm text-label-sm text-on-surface-variant tracking-normal">
        {label}
      </span>
      <button
        aria-expanded={open}
        className="flex h-12 w-full items-center justify-between rounded border border-outline bg-surface px-3 font-body-md text-body-md text-on-surface outline-none transition-colors hover:border-primary focus:border-2 focus:border-primary focus:px-[11px]"
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <MaterialIcon className="text-[20px]" name="expand_more" />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
          {options.map((option) => {
            const optionSelected = option.value === value;

            return (
              <button
                className={`block w-full px-3 py-2 text-left font-body-md text-body-md transition-colors ${
                  optionSelected
                    ? "bg-primary text-on-primary"
                    : "text-on-surface hover:bg-surface-container-high"
                }`}
                key={option.value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </label>
  );
}
