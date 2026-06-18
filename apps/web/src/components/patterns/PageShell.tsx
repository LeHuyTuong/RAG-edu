import type { FC, ReactNode } from "react";
import { TopNav } from "../layout/TopNav";
import { SideNav } from "../layout/SideNav";
import { Footer } from "../layout/Footer";
import {
  sideNavItems as mockSideNavItems,
  styleGuideLayout,
} from "@/data/mockData";
import type { SideNavItem } from "../../types/sideNav";

export interface PageShellProps {
  readonly children: ReactNode;
}

export const PageShell: FC<PageShellProps> = ({ children }) => {
  const pageNavItems: SideNavItem[] = mockSideNavItems.map((item) => ({
    label: item.label,
    icon: item.icon,
    section: item.section,
    href: `#${item.label.toLowerCase().replace(/\s+/g, "-")}`,
  }));

  return (
    <div className="bg-surface text-on-surface min-h-screen relative">
      <TopNav
        brandName={styleGuideLayout.brandName}
        avatarUrl={styleGuideLayout.userAvatarUrl}
      />
      <div className="flex max-w-container-max mx-auto px-margin-desktop py-gutter">
        <SideNav
          title={styleGuideLayout.sideNavTitle}
          subtitle={styleGuideLayout.sideNavSubtitle}
          items={pageNavItems}
          footerContent={
            <button className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-on-primary-fixed-variant">
              {styleGuideLayout.sideNavCtaLabel}
            </button>
          }
        />
        <main className="flex-1 w-full pb-32">{children}</main>
      </div>
      <Footer brandText={styleGuideLayout.footerText} />
    </div>
  );
};
