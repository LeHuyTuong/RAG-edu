import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { productCard, profileCard, styleGuideLabels } from "@/data/mockData";
import type { FC } from "react";

export interface InfoCardsSectionProps {
  readonly title: string;
}

export const InfoCardsSection: FC<InfoCardsSectionProps> = ({ title }) => {
  return (
    <Card className="p-6 flex flex-col gap-6">
      <h3 className="font-headline-md text-headline-md">{title}</h3>
      <div className="flex flex-col gap-6">
        <div className="border border-outline-variant rounded-2xl overflow-hidden bg-surface flex w-full">
          <img
            src={productCard.imageUrl}
            alt={productCard.imageAlt}
            className="w-32 h-32 object-cover"
          />
          <div className="p-4 flex flex-col justify-between flex-1">
            <div>
              <h4 className="font-label-md text-lg font-bold">
                {productCard.title}
              </h4>
              <p className="text-on-surface-variant text-sm mt-1">
                {productCard.description}
              </p>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold text-primary">
                {productCard.price}
              </span>
              <Button size="sm">{styleGuideLabels.cards.buyLabel}</Button>
            </div>
          </div>
        </div>

        <div className="border border-outline-variant rounded-2xl p-6 bg-surface flex flex-col items-center text-center">
          <img
            src={profileCard.avatarUrl}
            alt={profileCard.imageAlt}
            className="w-20 h-20 rounded-full object-cover border-4 border-surface shadow-sm mb-3"
          />
          <h4 className="font-label-md text-lg font-bold">
            {profileCard.name}
          </h4>
          <p className="text-on-surface-variant text-sm mb-4">
            {profileCard.title}
          </p>
          <Button variant="secondary" className="w-full">
            {styleGuideLabels.cards.contactLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
};
