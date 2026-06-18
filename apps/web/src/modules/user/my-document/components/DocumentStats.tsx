import { StatCard } from "./StatCard";

interface Props {
  /** Real total from pagination.total (GET /documents/me). */
  readonly totalDocuments: number;
  /** Shows a loading placeholder while the first fetch completes. */
  readonly isLoading: boolean;
}

/**
 * Four-column stats row shown at the top of the My Documents page.
 *
 * Only "Tổng tài liệu" is backed by real API data (pagination.total).
 * Views / downloads / contribution level are UI placeholders — the current
 * backend does not expose per-user engagement counters.
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
      {/* Placeholder — API does not yet return per-user view count */}
      <StatCard
        icon="visibility"
        label="Lượt xem"
        value="—"
        iconBg="bg-secondary/10"
        iconColor="text-secondary"
      />
      {/* Placeholder — API does not yet return per-user download count */}
      <StatCard
        icon="download"
        label="Lượt tải"
        value="—"
        iconBg="bg-tertiary/10"
        iconColor="text-tertiary"
      />
      {/* Placeholder — contribution level is a future gamification feature */}
      <StatCard
        icon="workspace_premium"
        label="Đóng góp"
        value="Level 1"
        iconBg="bg-[#dcfce7]"
        iconColor="text-[#166534]"
      />
    </section>
  );
}
