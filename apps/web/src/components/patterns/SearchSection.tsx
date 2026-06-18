"use client";

import { Card } from "../ui/Card";
import { SearchInput } from "../ui/SearchInput";
import { useStyleGuideControls } from "@/hooks";
import { styleGuideLabels } from "@/data/mockData";
import type { FC } from "react";

export interface SearchSectionProps {
  readonly title: string;
}

export const SearchSection: FC<SearchSectionProps> = ({ title }) => {
  const controls = useStyleGuideControls();

  return (
    <Card title={title} className="space-y-6 p-6">
      <SearchInput
        label={styleGuideLabels.inputs.searchLabel}
        value={controls.search}
        onChange={(event) => controls.setSearch(event.target.value)}
        onClear={() => controls.setSearch("")}
        placeholder={styleGuideLabels.inputs.searchPlaceholder}
      />
    </Card>
  );
};
