"use client";

import type { FC } from "react";

export interface RadioOption {
  readonly label: string;
  readonly value: string;
}

export interface RadioGroupProps {
  readonly name: string;
  readonly options: readonly RadioOption[];
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export const RadioGroup: FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
}) => {
  return (
    <div className="flex gap-4">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-2 cursor-pointer"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(event) => onChange(event.target.value)}
            className="w-4 h-4 text-primary border-outline focus:ring-primary"
          />
          <span className="font-body-md text-body-md text-on-surface">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
};
