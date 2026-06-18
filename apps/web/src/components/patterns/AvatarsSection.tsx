import { Avatar } from "../ui/Avatar";
import { Card } from "../ui/Card";
import { avatars } from "@/data/mockData";
import type { FC } from "react";

export interface AvatarsSectionProps {
  readonly title: string;
}

export const AvatarsSection: FC<AvatarsSectionProps> = ({ title }) => {
  return (
    <Card className="p-6">
      <h3 className="mb-6 font-headline-md text-headline-md">{title}</h3>
      <div className="flex items-center gap-4">
        {avatars.map((avatar, index) => {
          const key =
            ("imageUrl" in avatar ? avatar.imageUrl : undefined) ??
            ("initials" in avatar ? avatar.initials : undefined) ??
            index;

          return (
            <Avatar
              key={key}
              imageUrl={"imageUrl" in avatar ? avatar.imageUrl : undefined}
              initials={"initials" in avatar ? avatar.initials : undefined}
              size={avatar.size as "md" | "lg"}
              tone={"tone" in avatar ? avatar.tone : undefined}
              className={"imageUrl" in avatar ? "" : "font-bold"}
            />
          );
        })}
      </div>
    </Card>
  );
};
