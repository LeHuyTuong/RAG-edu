"use client";

import { Card } from "../ui/Card";
import { SelectField } from "../ui/SelectField";
import { Checkbox } from "../ui/Checkbox";
import { RadioGroup } from "../ui/RadioGroup";
import { Switch } from "../ui/Switch";
import { selectOptions, styleGuideLabels } from "@/data/mockData";
import { useStyleGuideControls } from "@/hooks";
import type { FC } from "react";

export interface SelectionSectionProps {
  readonly title: string;
}

export const SelectionSection: FC<SelectionSectionProps> = ({ title }) => {
  const controls = useStyleGuideControls();

  return (
    <Card className="space-y-8 p-6">
      <div>
        <h3 className="mb-4 font-headline-md text-headline-md">{title}</h3>
        <SelectField
          label={styleGuideLabels.selection.cityLabel}
          options={selectOptions}
          value={controls.city}
          onChange={controls.setCity}
          expanded
          widthClassName="w-64"
        />
      </div>
      <div className="flex flex-wrap gap-8">
        <Checkbox
          label={styleGuideLabels.selection.rememberLabel}
          checked={controls.remember}
          onChange={controls.setRemember}
        />
        <RadioGroup
          name="gender"
          value={controls.gender}
          onChange={controls.setGender}
          options={styleGuideLabels.selection.genderOptions}
        />
      </div>
      <div>
        <h3 className="mb-4 font-headline-md text-headline-md">
          {styleGuideLabels.selection.switchTitle}
        </h3>
        <div className="flex gap-4">
          <Switch checked onChange={() => undefined} />
          <Switch checked={false} onChange={() => undefined} />
        </div>
      </div>
    </Card>
  );
};
