"use client";

import type { FC } from "react";
import { useState } from "react";

const SORT_OPTIONS = ["Mới nhất", "Tải xuống nhiều nhất", "Đánh giá cao nhất"];

export interface SortDropdownProps extends Readonly<Record<string, never>> {}

export const SortDropdown: FC<SortDropdownProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(SORT_OPTIONS[0]);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 relative">
      <span>Sắp xếp:</span>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-gray-900 font-bold cursor-pointer user-select-none"
        >
          {selected}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg min-w-max z-50 overflow-hidden">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className="w-full px-4 py-2 text-left text-gray-900 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                onClick={() => {
                  setSelected(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SortDropdown;
