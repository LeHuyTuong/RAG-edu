"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  demoPurchasePlan,
  fetchBillingFlow,
  fetchBillingSummary,
  type BillingPlan,
  type BillingSummary,
  type UsageQuota,
} from "@/apis/billing.api";
import { AppDialog } from "@/components/ui/AppDialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const planToneClasses = {
  FREE: "border-outline-variant bg-surface",
  STUDENT_PLUS: "border-primary bg-primary-container/25",
  PRO: "border-tertiary bg-tertiary-container/25",
} as const;

const planIcon: Record<string, string> = {
  FREE: "school",
  STUDENT_PLUS: "auto_awesome",
  PRO: "workspace_premium",
};

function formatCurrency(value: number): string {
  if (value === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatStorage(mb: number): string {
  if (mb >= 1024) {
    return `${Math.round((mb / 1024) * 10) / 10} GB`;
  }
  return `${mb} MB`;
}

function percent(used: number, limit: number): number {
  if (!limit) return 0;
  return Math.min(Math.round((used / limit) * 100), 100);
}

function QuotaMeter({
  icon,
  label,
  used,
  limit,
  remaining,
  unit = "",
}: {
  readonly icon: string;
  readonly label: string;
  readonly used: number;
  readonly limit: number;
  readonly remaining: number;
  readonly unit?: string;
}): React.JSX.Element {
  const progress = percent(used, limit);

  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">
            {icon}
          </span>
          <span className="font-label-md text-label-md text-on-surface">
            {label}
          </span>
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          còn {remaining}
          {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
        {used}/{limit}
        {unit} đã dùng
      </p>
    </div>
  );
}

function CurrentPlan({
  summary,
}: {
  readonly summary: BillingSummary;
}): React.JSX.Element {
  const { currentSubscription, usage } = summary;

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
      <div className="rounded-lg border border-outline-variant bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">
              Gói hiện tại
            </p>
            <h1 className="mt-2 font-headline-lg text-headline-lg text-on-surface">
              {currentSubscription.plan.name}
            </h1>
          </div>
          <span className="rounded-full bg-primary-container px-3 py-1 font-label-sm text-label-sm text-on-primary-container">
            {currentSubscription.status}
          </span>
        </div>

        <div className="mt-6 grid gap-3 text-sm text-on-surface-variant">
          <div className="flex items-center justify-between">
            <span>Chu kỳ</span>
            <span className="font-medium text-on-surface">
              {formatDate(currentSubscription.currentPeriodStart)} -{" "}
              {formatDate(currentSubscription.currentPeriodEnd)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Giá</span>
            <span className="font-medium text-on-surface">
              {formatCurrency(currentSubscription.plan.priceVnd)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>File tối đa</span>
            <span className="font-medium text-on-surface">
              {currentSubscription.plan.maxFileSizeMb} MB/file
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <QuotaMeter
          icon="smart_toy"
          label="AI chat"
          limit={usage.chatLimit}
          remaining={usage.chatRemaining}
          used={usage.chatUsed}
        />
        <QuotaMeter
          icon="description"
          label="Tài liệu"
          limit={usage.documentLimit}
          remaining={usage.documentRemaining}
          used={usage.documentUsed}
        />
        <QuotaMeter
          icon="database"
          label="Lưu trữ"
          limit={usage.storageMbLimit}
          remaining={usage.storageMbRemaining}
          unit=" MB"
          used={usage.storageMbUsed}
        />
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  currentCode,
  purchasing,
  onSelect,
}: {
  readonly plan: BillingPlan;
  readonly currentCode: string;
  readonly purchasing: boolean;
  readonly onSelect: (plan: BillingPlan) => void;
}): React.JSX.Element {
  const isCurrent = plan.code === currentCode;
  const tone =
    planToneClasses[plan.code as keyof typeof planToneClasses] ??
    "border-outline-variant bg-surface";

  return (
    <article className={cn("rounded-lg border p-5", tone)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-surface text-primary">
          <span className="material-symbols-outlined text-[24px]">
            {planIcon[plan.code] ?? "bolt"}
          </span>
        </span>
        {isCurrent ? (
          <span className="rounded-full bg-primary px-3 py-1 font-label-sm text-label-sm text-on-primary">
            Đang dùng
          </span>
        ) : null}
      </div>

      <h2 className="font-title-lg text-title-lg text-on-surface">
        {plan.name}
      </h2>
      <p className="mt-2 min-h-12 font-body-sm text-body-sm text-on-surface-variant">
        {plan.description}
      </p>

      <div className="mt-5">
        <span className="font-headline-md text-headline-md text-on-surface">
          {formatCurrency(plan.priceVnd)}
        </span>
        {plan.priceVnd > 0 ? (
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            /tháng
          </span>
        ) : null}
      </div>

      <ul className="mt-5 space-y-3 font-body-sm text-body-sm text-on-surface">
        <li className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">
            check
          </span>
          {plan.chatCreditsPerMonth} lượt hỏi AI/tháng
        </li>
        <li className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">
            check
          </span>
          {plan.documentQuota} tài liệu
        </li>
        <li className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">
            check
          </span>
          {formatStorage(plan.storageMb)} lưu trữ
        </li>
        <li className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">
            check
          </span>
          File tối đa {plan.maxFileSizeMb} MB
        </li>
      </ul>

      <Button
        className="mt-6 w-full"
        disabled={isCurrent || purchasing}
        onClick={() => onSelect(plan)}
        type="button"
        variant={isCurrent ? "secondary" : "primary"}
      >
        {isCurrent ? "Đang sử dụng" : "Chọn gói"}
      </Button>
    </article>
  );
}

function FlowPanel({ steps }: { readonly steps: string[] }): React.JSX.Element {
  return (
    <section className="rounded-lg border border-outline-variant bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">
          account_tree
        </span>
        <h2 className="font-title-md text-title-md text-on-surface">
          Flow demo
        </h2>
      </div>
      <ol className="grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <li
            className="rounded-lg border border-outline-variant bg-surface-container-low p-3"
            key={`${step}-${index}`}
          >
            <span className="font-label-sm text-label-sm text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface">
              {step}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function BillingPage(): React.JSX.Element {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [flowSteps, setFlowSteps] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchBillingSummary(), fetchBillingFlow()])
      .then(([billingSummary, steps]) => {
        if (!mounted) return;
        setSummary(billingSummary);
        setFlowSteps(steps);
      })
      .catch(() => {
        if (mounted) toast.error("Không tải được thông tin gói AI");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const currentCode = summary?.currentSubscription.plan.code ?? "";
  const sortedPlans = useMemo(
    () => summary?.availablePlans ?? [],
    [summary?.availablePlans],
  );

  const handleConfirmPurchase = async () => {
    if (!selectedPlan) return;

    try {
      setPurchasing(true);
      const nextSummary = await demoPurchasePlan(selectedPlan.code);
      setSummary(nextSummary);
      setSelectedPlan(null);
      toast.success(`Đã kích hoạt gói ${selectedPlan.name}`);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-lg bg-surface-container" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-72 animate-pulse rounded-lg bg-surface-container" />
          <div className="h-72 animate-pulse rounded-lg bg-surface-container" />
          <div className="h-72 animate-pulse rounded-lg bg-surface-container" />
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-lg border border-outline-variant bg-surface p-6">
        <p className="font-body-md text-body-md text-on-surface">
          Không có dữ liệu gói AI.
        </p>
      </div>
    );
  }

  const usage: UsageQuota = summary.usage;

  return (
    <div className="space-y-6">
      <CurrentPlan summary={summary} />

      {usage.chatRemaining <= 3 ? (
        <section className="rounded-lg border border-error/30 bg-error-container p-4 text-on-error-container">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">warning</span>
            <p className="font-label-md text-label-md">
              Lượt hỏi AI còn thấp. Nâng cấp gói để tiếp tục học với AI.
            </p>
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Chọn gói AI
            </h2>
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              Thanh toán demo chỉ cần xác nhận, không gọi cổng thanh toán.
            </p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {sortedPlans.map((plan) => (
            <PlanCard
              currentCode={currentCode}
              key={plan.code}
              onSelect={setSelectedPlan}
              plan={plan}
              purchasing={purchasing}
            />
          ))}
        </div>
      </section>

      <FlowPanel steps={flowSteps} />

      <AppDialog
        description={
          selectedPlan
            ? `Xác nhận kích hoạt ${selectedPlan.name}. Quota tháng sẽ được reset theo gói mới.`
            : undefined
        }
        footer={
          <>
            <Button
              disabled={purchasing}
              onClick={() => setSelectedPlan(null)}
              type="button"
              variant="secondary"
            >
              Hủy
            </Button>
            <Button
              disabled={purchasing}
              onClick={handleConfirmPurchase}
              type="button"
            >
              {purchasing ? "Đang xác nhận..." : "Xác nhận mua"}
            </Button>
          </>
        }
        icon="payments"
        onOpenChange={(open) => {
          if (!open) setSelectedPlan(null);
        }}
        open={Boolean(selectedPlan)}
        title="Thanh toán demo"
      >
        {selectedPlan ? (
          <div className="rounded-lg border border-outline-variant bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface">
                {selectedPlan.name}
              </span>
              <span className="font-title-md text-title-md text-primary">
                {formatCurrency(selectedPlan.priceVnd)}
              </span>
            </div>
            <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
              {selectedPlan.chatCreditsPerMonth} lượt hỏi AI,{" "}
              {selectedPlan.documentQuota} tài liệu,{" "}
              {formatStorage(selectedPlan.storageMb)} lưu trữ.
            </p>
          </div>
        ) : null}
      </AppDialog>
    </div>
  );
}
