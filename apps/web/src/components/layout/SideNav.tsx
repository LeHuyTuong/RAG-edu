"use client";

import { SideNavItem } from "@/types/sideNav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, type FC, type ReactNode } from "react";
import { Logo } from "../ui/Logo";

export interface SideNavProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly items: SideNavItem[];
  readonly footerContent?: ReactNode;
}

const isActiveRoute = (
  pathname: string,
  href: string,
  exact?: boolean,
): boolean => {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export const SideNav: FC<SideNavProps> = ({
  title,
  subtitle,
  items,
  footerContent,
}: SideNavProps) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const mainItems = items.filter((item) => item.section === "main");
  const secondaryItems = items.filter((item) => item.section === "secondary");

  const renderNavItem = (item: SideNavItem) => {
    const isActive =
      !item.action && isActiveRoute(pathname, item.href, item.exact);

    const className = `flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
      isActive
        ? "bg-primary/10 text-primary"
        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
    }`;

    const content = (
      <>
        <span
          className={`material-symbols-outlined text-lg ${isActive ? "text-primary" : ""}`}
        >
          {item.icon}
        </span>
        {item.label}
      </>
    );

    if (item.action) {
      return (
        <button
          key={item.label}
          type="button"
          className={className}
          onClick={item.action}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={className}
      >
        {content}
      </Link>
    );
  };

  return (
    <>
      <div className="lg:hidden border-b border-outline-variant bg-surface-container-high/95 px-4 py-3 backdrop-blur-xl transition-all duration-200">
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            aria-label="Open navigation"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant bg-surface text-on-surface transition hover:border-primary hover:text-primary"
            onClick={() => setIsOpen(true)}
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        </div>
      </div>

      <aside
        className="
          fixed
          left-0
          top-0
          z-30
          hidden
          h-screen
          w-72
          flex-col
          overflow-y-auto
          border-r
          border-outline-variant/60
          bg-surface-container-high/80
          px-6
          py-8
          backdrop-blur-[15px]
          lg:flex
        "
      >
        <div className="mb-8">
          <div className="mb-6">
            <Logo />
          </div>

          <h2 className="mb-2 font-headline-md text-headline-md font-bold text-primary">
            {title}
          </h2>
          {subtitle ? (
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {subtitle}
            </p>
          ) : null}
        </div>

        <nav
          className="mb-6 flex flex-col gap-2"
          aria-label="Primary navigation"
        >
          {mainItems.map(renderNavItem)}
        </nav>

        <div className="mb-auto border-t border-outline-variant pt-6">
          <div className="flex flex-col gap-2">
            {secondaryItems.map(renderNavItem)}
          </div>
        </div>

        {footerContent ? <div className="mt-6">{footerContent}</div> : null}
      </aside>

      {isOpen ? (
        <div className="fixed inset-0 z-50 overflow-hidden bg-surface/80 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto border-r border-outline-variant bg-surface p-6 shadow-2xl">
            <div className="mb-8 flex items-start justify-between gap-4">
              <Logo />
              <button
                type="button"
                aria-label="Close navigation"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-outline-variant bg-surface text-on-surface transition hover:border-primary hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="mb-6">
              <h2 className="mb-2 font-headline-sm text-headline-sm font-semibold text-primary">
                {title}
              </h2>
              {subtitle ? (
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <nav className="space-y-2" aria-label="Mobile navigation">
              {mainItems.map(renderNavItem)}
            </nav>

            {secondaryItems.length > 0 ? (
              <div className="mt-6 space-y-2 border-t border-outline-variant pt-6">
                {secondaryItems.map(renderNavItem)}
              </div>
            ) : null}

            {footerContent ? (
              <div className="mt-6 border-t border-outline-variant pt-6">
                {footerContent}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-y-0 left-72 h-full w-[calc(100%-18rem)] bg-transparent"
            onClick={() => setIsOpen(false)}
          />
        </div>
      ) : null}
    </>
  );
};
