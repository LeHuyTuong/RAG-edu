"use client";

import { InputField } from "./InputField";

export interface SearchInputProps extends Readonly<
  React.InputHTMLAttributes<HTMLInputElement>
> {
  readonly label?: string;
  readonly onClear?: () => void;
}

export function SearchInput({
  label,
  onClear,
  ...props
}: SearchInputProps): React.JSX.Element {
  return (
    <InputField
      label={label}
      placeholder={props.placeholder ?? "Tìm kiếm tài liệu, khóa học..."}
      leftIcon={
        <span className="material-symbols-outlined text-[20px]">search</span>
      }
      rightIcon={
        onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center justify-center rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-error"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        ) : null
      }
      {...props}
    />
  );
}
