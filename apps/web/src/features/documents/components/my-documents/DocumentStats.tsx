import { StatCard } from "./StatCard";

interface Props {
  /** Real total from pagination.total (GET /documents/me). */
  readonly totalDocuments: number;
  /** Shows a loading placeholder while the first fetch completes. */
  readonly isLoading: boolean;
}

/**
 * Stats row shown at the top of the My Documents page.
 * Only values exposed by the backend are displayed.
 */
export function DocumentStats({
  totalDocuments,
  isLoading,
}: Props): React.JSX.Element {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon="description"
        label="Tổng tài liệu"
        value={isLoading ? "…" : totalDocuments}
        iconBg="bg-primary/10"
        iconColor="text-primary"
      />
    </section>
  );
}
