import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { styleGuideLabels } from "@/data/mockData";
import type { FC } from "react";

export interface ButtonsSectionProps {
  readonly title: string;
}

export const ButtonsSection: FC<ButtonsSectionProps> = ({ title }) => {
  return (
    <Card title={title} className="p-6">
      <div className="flex flex-wrap gap-4">
        <Button variant="primary">{styleGuideLabels.buttons.primary}</Button>
        <Button variant="secondary">
          {styleGuideLabels.buttons.secondary}
        </Button>
        <Button variant="outline">{styleGuideLabels.buttons.outline}</Button>
        <Button variant="ghost">{styleGuideLabels.buttons.ghost}</Button>
      </div>
    </Card>
  );
};
