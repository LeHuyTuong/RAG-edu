"use client";

import type { ReactNode } from "react";
import type { SettingsNavItem, SettingsTab } from "../types";

interface SettingsShellProps {
  readonly title: string;
  readonly subtitle: string;
  readonly navItems: SettingsNavItem[];
  readonly activeTab: SettingsTab;
  readonly onTabChange: (tab: SettingsTab) => void;
  readonly children: ReactNode;
}

export function SettingsShell({
  title,
  subtitle,
  navItems,
  activeTab,
  onTabChange,
  children,
}: SettingsShellProps): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-normal text-on-surface">
          {title}
        </h1>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
          {subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar nav — glassmorphism card */}
        <nav
          className="h-max rounded-2xl border border-outline-variant p-4 lg:sticky lg:top-24 lg:col-span-3"
          style={{
            background:
              "color-mix(in srgb, var(--color-surface-container-high) 80%, transparent)",
            backdropFilter: "blur(15px)",
            WebkitBackdropFilter: "blur(15px)",
          }}
        >
          <ul className="flex gap-2 overflow-x-auto lg:flex-col">
            {navItems.map(({ key, label, icon }) => (
              <li key={key}>
                <button
                  className={`inline-flex w-full min-w-max items-center gap-2.5 rounded-xl px-4 py-3 text-left font-label-md text-label-md tracking-normal transition-colors ${
                    activeTab === key
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                  onClick={() => onTabChange(key)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {icon}
                  </span>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content */}
        <div className="space-y-6 lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
