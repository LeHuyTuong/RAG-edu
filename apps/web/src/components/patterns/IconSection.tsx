import { Card } from "../ui/Card";
import { iconRow } from "@/data/mockData";
import type { FC } from "react";

export interface IconSectionProps {
  readonly title: string;
}

export const IconSection: FC<IconSectionProps> = ({ title }) => {
  return (
    <Card title={title} className="p-6">
      <div className="flex gap-8 text-on-surface-variant">
        {iconRow.map((icon) => (
          <span key={icon} className="material-symbols-outlined text-[32px]">
            {icon}
          </span>
        ))}
      </div>
    </Card>
  );
};
