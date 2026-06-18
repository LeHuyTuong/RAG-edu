import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "primary" | "secondary" | "tertiary" | "error" | "neutral";

const toneClasses: Record<Tone, string> = {
  primary: "bg-primary-fixed text-on-primary-fixed-variant",
  secondary: "bg-secondary-fixed text-on-secondary-fixed-variant",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  error: "bg-error-container text-on-error-container",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

export function MaterialIcon({
  name,
  className = "",
  filled = false,
}: {
  readonly name: string;
  readonly className?: string;
  readonly filled?: boolean;
}): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: '"FILL" 1' } : undefined}
    >
      {name}
    </span>
  );
}

export function ModeratorBadge({
  children,
  tone = "neutral",
  className = "",
}: {
  readonly children: ReactNode;
  readonly tone?: Tone;
  readonly className?: string;
}): React.JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 font-label-sm text-label-sm ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function ModeratorCard({
  children,
  className = "",
}: {
  readonly children: ReactNode;
  readonly className?: string;
}): React.JSX.Element {
  return (
    <section
      className={`border border-outline-variant bg-surface-container-lowest ${className}`}
    >
      {children}
    </section>
  );
}

export function IconButton({
  label,
  icon,
  tone = "neutral",
  onClick,
  href,
}: {
  readonly label: string;
  readonly icon: string;
  readonly tone?: Tone;
  readonly onClick?: () => void;
  readonly href?: string;
}): React.JSX.Element {
  const className =
    tone === "primary"
      ? "text-primary hover:bg-primary/10"
      : tone === "error"
        ? "text-error hover:bg-error/10"
        : tone === "tertiary"
          ? "text-tertiary hover:bg-tertiary/10"
          : "text-on-surface-variant hover:bg-surface-container-high";

  if (href) {
    return (
      <Link
        aria-label={label}
        className={`inline-flex h-9 w-9 items-center justify-center rounded transition-colors ${className}`}
        href={href}
        title={label}
      >
        <MaterialIcon name={icon} />
      </Link>
    );
  }

  return (
    <button
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded transition-colors ${className}`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <MaterialIcon name={icon} />
    </button>
  );
}

export function EmptyState({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 text-center">
      <MaterialIcon
        className="mb-3 text-4xl text-on-surface-variant"
        name="inbox"
      />
      <h3 className="font-label-md text-label-md text-on-surface">{title}</h3>
      <p className="mt-1 max-w-sm font-label-sm text-label-sm text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}
