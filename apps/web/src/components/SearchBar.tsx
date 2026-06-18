import type { FC } from "react";

export interface SearchBarProps extends Readonly<{
  placeholder?: string;
  defaultValue?: string;
}> {}

export const SearchBar: FC<SearchBarProps> = ({
  placeholder = "Search...",
  defaultValue = "",
}) => {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-80">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#888"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="border-none bg-transparent outline-none ml-2 w-full text-gray-900 placeholder-gray-500"
      />
    </div>
  );
};

export default SearchBar;
