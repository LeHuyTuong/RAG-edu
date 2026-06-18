import type { FC, ReactNode } from "react";

export interface CardProps {
  readonly title?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export const Card: FC<CardProps> = ({ title, children, className = "" }) => {
  return (
    <div
      className={`border border-outline-variant rounded-2xl bg-surface-container-lowest ${className}`}
    >
      {title ? (
        <h3 className="font-headline-md text-headline-md mb-6">{title}</h3>
      ) : null}
      {children}
    </div>
  );
};
