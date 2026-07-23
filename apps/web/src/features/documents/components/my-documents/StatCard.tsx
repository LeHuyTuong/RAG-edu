import { Card } from "@/components/ui/Card";

export interface StatCardProps {
  /** Material Symbol icon name */
  readonly icon: string;
  readonly label: string;
  readonly value: string | number;
  /** Tailwind bg-* class for the icon circle */
  readonly iconBg: string;
  /** Tailwind text-* class for the icon colour */
  readonly iconColor: string;
}

/**
 * Single statistics card used in the My Documents dashboard.
 * Built with the Card UI primitive so it stays consistent with the rest of
 * the app's surface system.
 */
export function StatCard({
  icon,
  label,
  value,
  iconBg,
  iconColor,
}: StatCardProps): React.JSX.Element {
  return (
    <Card className="flex items-center gap-4 p-5 shadow-sm shadow-black/5">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}
      >
        <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-on-surface">{value}</p>
      </div>
    </Card>
  );
}
