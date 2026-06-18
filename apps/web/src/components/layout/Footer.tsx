import { footerLinks } from "@/data/mockData";
import type { FC } from "react";

export interface FooterProps {
  readonly brandText: string;
}

export const Footer: FC<FooterProps> = ({ brandText }) => {
  return (
    <footer className="w-full py-8 px-margin-desktop border-t border-outline-variant bg-surface flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto mt-auto transition-colors duration-200">
      <div className="font-label-md text-label-md font-bold text-primary mb-4 md:mb-0">
        {brandText}
      </div>
      <nav className="flex gap-6 flex-wrap justify-center">
        {footerLinks.map((link) => (
          <a
            key={link.label}
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors duration-200"
            href={link.href}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  );
};
