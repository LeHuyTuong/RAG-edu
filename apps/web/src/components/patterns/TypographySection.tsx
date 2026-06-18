import { Card } from "../ui/Card";
import { typographySamples } from "@/data/mockData";
import type { FC } from "react";

export interface TypographySectionProps {
  readonly title: string;
}

export const TypographySection: FC<TypographySectionProps> = ({ title }) => {
  return (
    <Card title={title} className="p-6">
      <div className="space-y-4">
        {typographySamples.map((sample) => (
          <div key={sample.label}>
            <span className={`${sample.className} text-on-surface`}>
              {sample.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
