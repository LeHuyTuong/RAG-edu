"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectField } from "@/components/ui/SelectField";
import { MaterialIcon } from "./ModeratorPrimitives";

export interface ModeratorFilterToolbarProps {
  readonly filterLabel: string;
  readonly filterOptions: readonly string[];
  readonly filterValue: string;
  readonly onFilterChange: (value: string) => void;
  readonly onQueryChange: (value: string) => void;
  readonly onQueryClear: () => void;
  readonly onReset: () => void;
  readonly query: string;
  readonly resetLabel?: string;
  readonly searchLabel?: string;
  readonly searchPlaceholder: string;
}

export function ModeratorFilterToolbar({
  filterLabel,
  filterOptions,
  filterValue,
  onFilterChange,
  onQueryChange,
  onQueryClear,
  onReset,
  query,
  resetLabel = "Làm mới danh sách",
  searchLabel = "Tìm kiếm",
  searchPlaceholder,
}: ModeratorFilterToolbarProps): React.JSX.Element {
  return (
    <Card className="rounded-lg p-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(320px,1fr)_260px_auto] lg:items-end">
        <SearchInput
          label={searchLabel}
          onChange={(event) => onQueryChange(event.target.value)}
          onClear={onQueryClear}
          placeholder={searchPlaceholder}
          type="search"
          value={query}
        />
        <SelectField
          label={filterLabel}
          onChange={onFilterChange}
          options={filterOptions}
          value={filterValue}
        />
        <Button
          className="flex min-h-10 items-center justify-center gap-2 rounded-lg px-5"
          onClick={onReset}
          variant="secondary"
        >
          <MaterialIcon name="refresh" />
          {resetLabel}
        </Button>
      </div>
    </Card>
  );
}
