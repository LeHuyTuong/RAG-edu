"use client";

import { InputField } from "../ui/InputField";
import { Card } from "../ui/Card";
import { useStyleGuideControls } from "@/hooks";
import { styleGuideLabels } from "@/data/mockData";
import type { FC } from "react";

export interface InputsSectionProps {
  readonly title: string;
}

export const InputsSection: FC<InputsSectionProps> = ({ title }) => {
  const controls = useStyleGuideControls();

  return (
    <Card title={title} className="space-y-6 p-6">
      <InputField
        label={styleGuideLabels.inputs.nameLabel}
        placeholder={styleGuideLabels.inputs.namePlaceholder}
        value={controls.name}
        onChange={(event) => controls.setName(event.target.value)}
      />
      <InputField
        label={styleGuideLabels.inputs.passwordLabel}
        type="password"
        value={controls.password}
        rightIcon={
          <span className="material-symbols-outlined">visibility</span>
        }
        onChange={(event) => controls.setPassword(event.target.value)}
      />
      <InputField
        label={styleGuideLabels.inputs.emailLabel}
        value={controls.email}
        errorText={styleGuideLabels.inputs.emailError}
        onChange={(event) => controls.setEmail(event.target.value)}
      />
    </Card>
  );
};
