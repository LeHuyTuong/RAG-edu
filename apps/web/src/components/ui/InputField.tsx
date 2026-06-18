"use client";

import type { ReactNode } from "react";

export interface InputFieldProps extends Readonly<
  React.InputHTMLAttributes<HTMLInputElement>
> {
  readonly label?: string;
  readonly helperText?: string;
  readonly errorText?: string;
  readonly leftIcon?: ReactNode;
  readonly rightIcon?: ReactNode;
}

export function InputField({
  label,
  helperText,
  errorText,
  leftIcon,
  rightIcon,
  className = "",
  required,
  ...props
}: InputFieldProps): React.JSX.Element {
  const hasError = Boolean(errorText);
  const leftPaddingClasses = leftIcon
    ? "pl-10 focus:pl-[39px]"
    : "pl-3 focus:pl-[11px]";
  const rightPaddingClasses = rightIcon
    ? "pr-10 focus:pr-[39px]"
    : "pr-3 focus:pr-[11px]";

  return (
    <label className="block">
      {label ? (
        <span
          className={`mb-1 block font-label-sm text-label-sm ${
            hasError ? "text-error" : "text-on-surface-variant"
          }`}
        >
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-0.5 font-bold text-error">
              *
            </span>
          ) : null}
        </span>
      ) : null}
      <div className="relative">
        {leftIcon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            {leftIcon}
          </span>
        ) : null}
        <input
          className={`w-full rounded-xl border bg-surface py-2 font-body-md focus:border-2 focus:border-primary focus:py-[7px] focus:outline-none ${leftPaddingClasses} ${rightPaddingClasses} ${
            hasError
              ? "border-error bg-error-container text-error"
              : "border-outline"
          } ${className}`}
          required={required}
          {...props}
        />
        {rightIcon ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            {rightIcon}
          </span>
        ) : null}
      </div>
      {helperText ? (
        <span className="mt-1 block font-label-sm text-label-sm text-on-surface-variant">
          {helperText}
        </span>
      ) : null}
      {errorText ? (
        <span className="mt-1 block font-label-sm text-label-sm text-error">
          {errorText}
        </span>
      ) : null}
    </label>
  );
}
