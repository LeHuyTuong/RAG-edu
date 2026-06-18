import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { statusBadges, hashtagTags, styleGuideLabels } from "@/data/mockData";
import type { FC } from "react";

export interface TagsSectionProps {
  readonly title: string;
}

export const TagsSection: FC<TagsSectionProps> = ({ title }) => {
  return (
    <Card className="p-6">
      <h3 className="font-headline-md text-headline-md mb-6">{title}</h3>
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 flex-wrap">
          {statusBadges.map((badge) => (
            <Badge
              key={badge.label}
              tone={badge.tone as "success" | "warning" | "error"}
            >
              {badge.label}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {hashtagTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-outline-variant bg-surface text-on-surface-variant"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
};
