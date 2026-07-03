"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { SideNavItem } from "@/types/sideNav";

import { SideNav } from "./SideNav";

export interface DashboardShellProps {
  readonly children: ReactNode;
  readonly title: string;
  readonly subtitle?: string;
  readonly items: readonly SideNavItem[];
  readonly footerContent?: ReactNode;
  readonly rootClassName?: string;
  readonly mainClassName?: string;
  readonly contentClassName?: string;
}

export function DashboardShell({
  children,
  title,
  subtitle,
  items,
  footerContent,
  rootClassName,
  mainClassName,
  contentClassName,
}: DashboardShellProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "min-h-screen bg-background text-on-surface",
        rootClassName,
      )}
    >
      <SideNav
        footerContent={footerContent}
        items={items}
        subtitle={subtitle}
        title={title}
      />

      <main
        className={cn(
          "min-h-screen overflow-x-hidden px-margin-mobile py-8 lg:ml-72 lg:px-margin-desktop",
          mainClassName,
        )}
      >
        <div
          className={cn(
            "mx-auto w-full min-w-0 max-w-container-max",
            contentClassName,
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
