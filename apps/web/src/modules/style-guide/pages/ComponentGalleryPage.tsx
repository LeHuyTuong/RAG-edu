"use client";

import { AvatarsSection } from "@/components/patterns/AvatarsSection";
import { ButtonsSection } from "@/components/patterns/ButtonsSection";
import { DataTableSection } from "@/components/patterns/DataTableSection";
import { FeedbackSection } from "@/components/patterns/FeedbackSection";
import { IconSection } from "@/components/patterns/IconSection";
import { InfoCardsSection } from "@/components/patterns/InfoCardsSection";
import { InputsSection } from "@/components/patterns/InputsSection";
import { PageShell } from "@/components/patterns/PageShell";
import { SearchSection } from "@/components/patterns/SearchSection";
import { SelectionSection } from "@/components/patterns/SelectionSection";
import { TagsSection } from "@/components/patterns/TagsSection";
import { TypographySection } from "@/components/patterns/TypographySection";
import {
  styleGuideLayout,
  styleGuideLabels,
  styleGuideSections,
} from "@/data/mockData";

export interface ComponentGalleryPageProps {
  readonly title?: string;
}

export default function ComponentGalleryPage({
  title = styleGuideLayout.pageTitle,
}: ComponentGalleryPageProps): React.JSX.Element {
  return (
    <PageShell>
      <h1 className="mb-12 font-display text-display text-on-surface">
        {title}
      </h1>

      <section className="mb-16">
        <h2 className="mb-8 border-b border-outline-variant pb-4 font-headline-lg text-headline-lg text-on-surface">
          {styleGuideSections.basics}
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <ButtonsSection title={styleGuideLabels.buttons.title} />
          <TypographySection title={styleGuideLabels.typography.title} />
          <div className="md:col-span-2">
            <IconSection title={styleGuideLabels.icons.title} />
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-8 border-b border-outline-variant pb-4 font-headline-lg text-headline-lg text-on-surface">
          {styleGuideSections.inputs}
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <InputsSection title={styleGuideLabels.inputs.title} />
          <SearchSection title={styleGuideLabels.inputs.searchTitle} />
          <SelectionSection title={styleGuideLabels.selection.title} />
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-8 border-b border-outline-variant pb-4 font-headline-lg text-headline-lg text-on-surface">
          {styleGuideSections.dataDisplay}
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="md:col-span-2">
            <DataTableSection title={styleGuideLabels.table.title} />
          </div>
          <InfoCardsSection title={styleGuideLabels.cards.title} />
          <div className="flex flex-col gap-8">
            <TagsSection title={styleGuideLabels.tags.title} />
            <AvatarsSection title={styleGuideLabels.avatars.title} />
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-8 border-b border-outline-variant pb-4 font-headline-lg text-headline-lg text-on-surface">
          {styleGuideSections.feedback}
        </h2>
        <FeedbackSection title={styleGuideLabels.feedback.toastTitle} />
      </section>
    </PageShell>
  );
}
