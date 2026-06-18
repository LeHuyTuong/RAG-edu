import { topNavLinks } from "@/data/mockData";
import { IconButton } from "../ui/IconButton";
import { Avatar } from "../ui/Avatar";
import type { FC } from "react";

export interface TopNavProps {
  readonly brandName: string;
  readonly avatarUrl: string;
}

export const TopNav: FC<TopNavProps> = ({ brandName, avatarUrl }) => {
  return (
    <header className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-16 sticky top-0 z-50 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <span className="font-headline-md text-headline-md font-bold text-primary">
          {brandName}
        </span>
        <nav className="hidden md:flex gap-6 ml-8">
          {topNavLinks.map((link) => (
            <a
              key={link.label}
              className="text-on-surface-variant font-label-md hover:text-primary transition-colors"
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <IconButton
          ariaLabel="Language"
          icon={<span className="material-symbols-outlined">language</span>}
        />
        <IconButton
          ariaLabel="Theme"
          icon={<span className="material-symbols-outlined">dark_mode</span>}
        />
        <IconButton
          ariaLabel="Notifications"
          icon={
            <span className="material-symbols-outlined">notifications</span>
          }
        />
        <Avatar
          imageUrl={avatarUrl}
          size="sm"
          className="border border-outline-variant"
        />
      </div>
    </header>
  );
};
