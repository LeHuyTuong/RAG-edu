"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppDialog } from "@/components/ui/AppDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { InputField } from "@/components/ui/InputField";
import { Table, type TableRow } from "@/components/ui/Table";
import {
  createAdminBillingPlan,
  deactivateAdminBillingPlan,
  fetchAdminBillingPlanDetail,
  fetchAdminBillingPlans,
  updateAdminBillingPlan,
  type AdminBillingCycle,
  type AdminBillingPlan,
  type AdminBillingPlanPayload,
} from "../api";
import {
  AdminCard,
  AdminIconAction,
  AdminSelect,
  MaterialIcon,
} from "../components/AdminPrimitives";

const billingPlanColumns = [
  { key: "code", label: "Mã gói", sortable: true },
  { key: "name", label: "Tên gói", sortable: true },
  { key: "price", label: "Giá", align: "right" as const },
  { key: "quota", label: "Quota" },
  { key: "order", label: "Thứ tự", align: "center" as const },
  { key: "status", label: "Trạng thái", align: "center" as const },
  { key: "actions", label: "Thao tác", align: "center" as const },
] as const;

const billingCycleOptions = [
  { label: "Hằng tháng", value: "MONTHLY" },
  { label: "Hằng năm", value: "YEARLY" },
] as const;

interface BillingPlanDraft {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly priceVnd: string;
  readonly billingCycle: AdminBillingCycle;
  readonly chatCreditsPerMonth: string;
  readonly documentQuota: string;
  readonly storageMb: string;
  readonly maxFileSizeMb: string;
  readonly displayOrder: string;
  readonly active: boolean;
}

const emptyDraft: BillingPlanDraft = {
  code: "",
  name: "",
  description: "",
  priceVnd: "0",
  billingCycle: "MONTHLY",
  chatCreditsPerMonth: "0",
  documentQuota: "0",
  storageMb: "0",
  maxFileSizeMb: "0",
  displayOrder: "0",
  active: true,
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

const formatCurrency = (value: number): string =>
  value === 0 ? "Miễn phí" : currencyFormatter.format(value);

const formatStorage = (mb: number): string => {
  if (mb >= 1024) {
    return `${Math.round((mb / 1024) * 10) / 10} GB`;
  }

  return `${mb} MB`;
};

const formatDate = (value?: string): string => {
  if (!value) return "Chưa có dữ liệu";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return dateFormatter.format(date);
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) return error.message;

  return fallback;
};

const toDraft = (plan: AdminBillingPlan): BillingPlanDraft => ({
  code: plan.code,
  name: plan.name,
  description: plan.description ?? "",
  priceVnd: String(plan.priceVnd),
  billingCycle: plan.billingCycle,
  chatCreditsPerMonth: String(plan.chatCreditsPerMonth),
  documentQuota: String(plan.documentQuota),
  storageMb: String(plan.storageMb),
  maxFileSizeMb: String(plan.maxFileSizeMb),
  displayOrder: String(plan.displayOrder),
  active: plan.active,
});

const parseNonNegativeNumber = (value: string): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return Math.floor(parsed);
};

type NumericDraftField =
  | "priceVnd"
  | "chatCreditsPerMonth"
  | "documentQuota"
  | "storageMb"
  | "maxFileSizeMb"
  | "displayOrder";

const numberFieldNames: readonly NumericDraftField[] = [
  "priceVnd",
  "chatCreditsPerMonth",
  "documentQuota",
  "storageMb",
  "maxFileSizeMb",
  "displayOrder",
];

const toPayload = (draft: BillingPlanDraft): AdminBillingPlanPayload | null => {
  const numericValues = Object.fromEntries(
    numberFieldNames.map((field) => [
      field,
      parseNonNegativeNumber(draft[field]),
    ]),
  ) as Record<NumericDraftField, number | null>;

  if (Object.values(numericValues).some((value) => value === null)) {
    return null;
  }

  const values = numericValues as Record<NumericDraftField, number>;

  return {
    code: draft.code.trim().toUpperCase(),
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    priceVnd: values.priceVnd,
    billingCycle: draft.billingCycle,
    chatCreditsPerMonth: values.chatCreditsPerMonth,
    documentQuota: values.documentQuota,
    storageMb: values.storageMb,
    maxFileSizeMb: values.maxFileSizeMb,
    displayOrder: values.displayOrder,
    active: draft.active,
  };
};

export default function AdminBillingPlanManagementPage(): React.JSX.Element {
  const [plans, setPlans] = useState<AdminBillingPlan[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<AdminBillingPlan | null>(null);
  const [viewPlan, setViewPlan] = useState<AdminBillingPlan | null>(null);
  const [deactivatePlan, setDeactivatePlan] = useState<AdminBillingPlan | null>(
    null,
  );
  const [draft, setDraft] = useState<BillingPlanDraft>(emptyDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formErrorMessage, setFormErrorMessage] = useState("");

  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      setPlans(await fetchAdminBillingPlans());
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Không thể tải danh sách gói."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const activeCount = useMemo(
    () => plans.filter((plan) => plan.active).length,
    [plans],
  );

  const handleOpenAdd = () => {
    setEditPlan(null);
    setDraft({
      ...emptyDraft,
      displayOrder: String(plans.length + 1),
    });
    setFormErrorMessage("");
    setFormOpen(true);
  };

  const handleOpenEdit = (plan: AdminBillingPlan) => {
    setEditPlan(plan);
    setDraft(toDraft(plan));
    setFormErrorMessage("");
    setFormOpen(true);
  };

  const handleOpenDetail = async (plan: AdminBillingPlan) => {
    setIsDetailLoading(true);
    setErrorMessage("");

    try {
      setViewPlan(await fetchAdminBillingPlanDetail(plan.id));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Không thể tải chi tiết gói."));
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!draft.code.trim() || !draft.name.trim()) {
      setFormErrorMessage("Vui lòng nhập đầy đủ mã gói và tên gói.");
      return;
    }

    const payload = toPayload(draft);
    if (!payload) {
      setFormErrorMessage("Các trường số phải là số nguyên không âm.");
      return;
    }

    setIsSaving(true);
    setFormErrorMessage("");

    try {
      if (editPlan) {
        await updateAdminBillingPlan(editPlan.id, payload);
      } else {
        await createAdminBillingPlan(payload);
      }

      toast.success(
        editPlan ? "Cập nhật gói thành công!" : "Tạo gói mới thành công!",
      );
      setFormOpen(false);
      setDraft(emptyDraft);
      setEditPlan(null);
      await loadPlans();
    } catch (error) {
      setFormErrorMessage(
        getErrorMessage(
          error,
          editPlan ? "Không thể cập nhật gói." : "Không thể tạo gói.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivatePlan = async () => {
    if (!deactivatePlan) return;

    setIsDeactivating(true);
    setErrorMessage("");

    try {
      await deactivateAdminBillingPlan(deactivatePlan.id);
      toast.success("Đã ngừng kích hoạt gói.");
      setDeactivatePlan(null);
      await loadPlans();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Không thể ngừng kích hoạt gói."));
    } finally {
      setIsDeactivating(false);
    }
  };

  const skeletonRows: TableRow[] = useMemo(
    () =>
      Array.from({ length: 4 }).map((_, index) => ({
        id: `skeleton-${index}`,
        cells: billingPlanColumns.map((column) => (
          <div
            className="h-5 w-24 animate-pulse rounded bg-surface-variant/40"
            key={column.key}
          />
        )),
      })),
    [],
  );

  const rows: TableRow[] = plans.map((plan) => ({
    id: plan.id,
    cells: [
      <span className="font-mono text-sm font-semibold text-primary" key="code">
        {plan.code}
      </span>,
      <div className="min-w-48" key="name">
        <p className="font-label-md text-label-md text-on-surface">
          {plan.name}
        </p>
        <p className="line-clamp-1 max-w-64 text-sm text-on-surface-variant">
          {plan.description || "Không có mô tả"}
        </p>
      </div>,
      <span className="font-label-md text-label-md text-on-surface" key="price">
        {formatCurrency(plan.priceVnd)}
      </span>,
      <span className="text-sm text-on-surface-variant" key="quota">
        {plan.chatCreditsPerMonth} chat · {plan.documentQuota} tài liệu ·{" "}
        {formatStorage(plan.storageMb)}
      </span>,
      <span className="text-sm text-on-surface-variant" key="order">
        {plan.displayOrder}
      </span>,
      <Badge key="status" tone={plan.active ? "success" : "neutral"}>
        {plan.active ? "Đang bật" : "Đã tắt"}
      </Badge>,
      <div className="flex justify-center gap-1" key="actions">
        <AdminIconAction
          icon="visibility"
          label={`Xem ${plan.name}`}
          onClick={() => void handleOpenDetail(plan)}
        />
        <AdminIconAction
          icon="edit"
          label={`Sửa ${plan.name}`}
          onClick={() => handleOpenEdit(plan)}
        />
        <AdminIconAction
          icon="block"
          label={`Ngừng kích hoạt ${plan.name}`}
          onClick={() => setDeactivatePlan(plan)}
          tone="error"
        />
      </div>,
    ],
  }));

  return (
    <div className="relative">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-on-surface">
            Quản lý gói AI
          </h1>
          <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Tạo, cập nhật quota và bật tắt các gói AI hiển thị ở trang Billing.
          </p>
        </div>
        <Button
          className="inline-flex h-[42px] items-center justify-center gap-2 self-start rounded-xl px-6"
          onClick={handleOpenAdd}
        >
          <MaterialIcon className="text-[18px]" name="add" />
          Thêm gói mới
        </Button>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded border border-error/30 bg-error-container px-4 py-3 font-label-sm text-label-sm text-error">
          {errorMessage}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryTile
          icon="inventory_2"
          label="Tổng số gói"
          value={plans.length}
        />
        <SummaryTile
          icon="toggle_on"
          label="Đang kích hoạt"
          value={activeCount}
        />
        <SummaryTile
          icon="toggle_off"
          label="Đã tắt"
          value={plans.length - activeCount}
        />
      </div>

      <AdminCard className="w-full max-w-[calc(100vw-32px)] overflow-hidden lg:max-w-none">
        <div className="flex flex-col gap-3 border-b border-outline-variant p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-label-md text-label-md text-on-surface">
              Danh sách gói
            </h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Sắp xếp theo thứ tự hiển thị trên trang người dùng.
            </p>
          </div>
          <Button
            onClick={() => void loadPlans()}
            type="button"
            variant="outline"
          >
            <MaterialIcon className="text-[18px]" name="refresh" />
            Làm mới
          </Button>
        </div>

        {isLoading ? (
          <Table columns={billingPlanColumns} rows={skeletonRows} />
        ) : rows.length > 0 ? (
          <Table columns={billingPlanColumns} rows={rows} />
        ) : (
          <div className="p-6 font-body-md text-body-md text-on-surface-variant">
            Chưa có gói nào trong hệ thống.
          </div>
        )}
      </AdminCard>

      {formOpen ? (
        <BillingPlanFormDialog
          draft={draft}
          errorMessage={formErrorMessage}
          isSaving={isSaving}
          isUpdate={editPlan !== null}
          onCancel={() => {
            setFormOpen(false);
            setEditPlan(null);
            setDraft(emptyDraft);
            setFormErrorMessage("");
          }}
          onChange={setDraft}
          onSave={handleSavePlan}
        />
      ) : null}

      {viewPlan ? (
        <BillingPlanDetailDialog
          onClose={() => setViewPlan(null)}
          onDeactivate={() => {
            setDeactivatePlan(viewPlan);
            setViewPlan(null);
          }}
          onEdit={() => {
            handleOpenEdit(viewPlan);
            setViewPlan(null);
          }}
          plan={viewPlan}
        />
      ) : null}

      {isDetailLoading ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-inverse-surface/20 px-4 py-8">
          <div className="rounded border border-outline-variant bg-surface-container-lowest px-5 py-3 font-label-md text-label-md text-on-surface">
            Đang tải chi tiết...
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        confirmLabel={isDeactivating ? "Đang tắt..." : "Ngừng kích hoạt"}
        description={
          deactivatePlan
            ? `Gói ${deactivatePlan.name} sẽ không còn hiển thị cho người dùng mới chọn mua.`
            : ""
        }
        disabled={isDeactivating}
        onCancel={() => setDeactivatePlan(null)}
        onConfirm={() => void handleDeactivatePlan()}
        open={deactivatePlan !== null}
        title="Ngừng kích hoạt gói"
      />
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
}: {
  readonly icon: string;
  readonly label: string;
  readonly value: number;
}): React.JSX.Element {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {label}
          </p>
          <p className="mt-1 font-headline-sm text-headline-sm text-on-surface">
            {value}
          </p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded bg-primary-container text-primary">
          <MaterialIcon name={icon} />
        </span>
      </div>
    </div>
  );
}

function BillingPlanFormDialog({
  draft,
  errorMessage,
  isSaving,
  isUpdate,
  onCancel,
  onChange,
  onSave,
}: {
  readonly draft: BillingPlanDraft;
  readonly errorMessage: string;
  readonly isSaving: boolean;
  readonly isUpdate: boolean;
  readonly onCancel: () => void;
  readonly onChange: (draft: BillingPlanDraft) => void;
  readonly onSave: () => void;
}): React.JSX.Element {
  const canSave =
    draft.code.trim().length > 0 && draft.name.trim().length > 0 && !isSaving;

  return (
    <AppDialog
      description={
        isUpdate ? "Cập nhật cấu hình gói hiện có" : "Tạo gói AI mới"
      }
      icon={isUpdate ? "edit" : "add"}
      onOpenChange={(open) => {
        if (!open && !isSaving) onCancel();
      }}
      open
      title={isUpdate ? "Cập nhật gói" : "Thêm gói"}
      footer={
        <>
          <Button disabled={isSaving} onClick={onCancel} variant="outline">
            Hủy
          </Button>
          <Button disabled={!canSave} onClick={onSave}>
            {isSaving ? "Đang lưu..." : isUpdate ? "Lưu thay đổi" : "Tạo gói"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {errorMessage ? (
          <p className="rounded border border-error/30 bg-error-container px-4 py-3 font-label-sm text-label-sm text-error">
            {errorMessage}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            label="Mã gói"
            onChange={(event) =>
              onChange({ ...draft, code: event.target.value })
            }
            placeholder="Ví dụ: STUDENT_PLUS"
            required
            value={draft.code}
          />
          <InputField
            label="Tên gói"
            onChange={(event) =>
              onChange({ ...draft, name: event.target.value })
            }
            placeholder="Ví dụ: Student Plus"
            required
            value={draft.name}
          />
          <div className="sm:col-span-2">
            <label className="block">
              <span className="mb-1 block font-label-sm text-label-sm text-on-surface-variant">
                Mô tả
              </span>
              <textarea
                className="min-h-24 w-full rounded-xl border border-outline bg-surface px-3 py-2 font-body-md text-on-surface focus:border-2 focus:border-primary focus:px-[11px] focus:py-[7px] focus:outline-none"
                onChange={(event) =>
                  onChange({ ...draft, description: event.target.value })
                }
                placeholder="Mô tả ngắn về quyền lợi của gói"
                value={draft.description}
              />
            </label>
          </div>
          <InputField
            label="Giá VND"
            min={0}
            onChange={(event) =>
              onChange({ ...draft, priceVnd: event.target.value })
            }
            type="number"
            value={draft.priceVnd}
          />
          <AdminSelect
            label="Chu kỳ"
            onChange={(billingCycle) => onChange({ ...draft, billingCycle })}
            options={billingCycleOptions}
            value={draft.billingCycle}
          />
          <InputField
            label="Lượt hỏi AI/tháng"
            min={0}
            onChange={(event) =>
              onChange({ ...draft, chatCreditsPerMonth: event.target.value })
            }
            type="number"
            value={draft.chatCreditsPerMonth}
          />
          <InputField
            label="Số tài liệu"
            min={0}
            onChange={(event) =>
              onChange({ ...draft, documentQuota: event.target.value })
            }
            type="number"
            value={draft.documentQuota}
          />
          <InputField
            label="Lưu trữ MB"
            min={0}
            onChange={(event) =>
              onChange({ ...draft, storageMb: event.target.value })
            }
            type="number"
            value={draft.storageMb}
          />
          <InputField
            label="File tối đa MB"
            min={0}
            onChange={(event) =>
              onChange({ ...draft, maxFileSizeMb: event.target.value })
            }
            type="number"
            value={draft.maxFileSizeMb}
          />
          <InputField
            label="Thứ tự hiển thị"
            min={0}
            onChange={(event) =>
              onChange({ ...draft, displayOrder: event.target.value })
            }
            type="number"
            value={draft.displayOrder}
          />
          <div className="flex items-end pb-2">
            <Checkbox
              checked={draft.active}
              label="Cho phép hiển thị và mua gói"
              onChange={(active) => onChange({ ...draft, active })}
            />
          </div>
        </div>
      </div>
    </AppDialog>
  );
}

function BillingPlanDetailDialog({
  plan,
  onClose,
  onEdit,
  onDeactivate,
}: {
  readonly plan: AdminBillingPlan;
  readonly onClose: () => void;
  readonly onEdit: () => void;
  readonly onDeactivate: () => void;
}): React.JSX.Element {
  return (
    <AppDialog
      description={
        <span className="font-mono text-primary">Mã: {plan.code}</span>
      }
      icon="workspace_premium"
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open
      title={plan.name}
      footer={
        <>
          <Button
            className="text-error hover:bg-error/10 hover:text-error"
            onClick={onDeactivate}
            type="button"
            variant="ghost"
          >
            <MaterialIcon className="text-[18px]" name="block" />
            Ngừng kích hoạt
          </Button>
          <div className="flex gap-3">
            <Button onClick={onClose} type="button" variant="outline">
              Đóng
            </Button>
            <Button onClick={onEdit} type="button">
              <MaterialIcon className="text-[18px]" name="edit" />
              Sửa gói
            </Button>
          </div>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailItem label="Giá" value={formatCurrency(plan.priceVnd)} />
        <DetailItem label="Chu kỳ" value={plan.billingCycle} />
        <DetailItem
          label="Lượt hỏi AI"
          value={`${plan.chatCreditsPerMonth} lượt/tháng`}
        />
        <DetailItem label="Tài liệu" value={`${plan.documentQuota} tài liệu`} />
        <DetailItem label="Lưu trữ" value={formatStorage(plan.storageMb)} />
        <DetailItem label="File tối đa" value={`${plan.maxFileSizeMb} MB`} />
        <DetailItem label="Thứ tự hiển thị" value={String(plan.displayOrder)} />
        <DetailItem
          label="Trạng thái"
          value={plan.active ? "Đang kích hoạt" : "Đã tắt"}
        />
        <DetailItem label="Ngày tạo" value={formatDate(plan.createdAt)} />
        <DetailItem
          label="Cập nhật gần nhất"
          value={formatDate(plan.updatedAt)}
        />
      </div>
      {plan.description ? (
        <div className="mt-3 rounded border border-outline-variant bg-surface-container-low p-4">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Mô tả
          </p>
          <p className="mt-1 font-body-md text-body-md text-on-surface">
            {plan.description}
          </p>
        </div>
      ) : null}
    </AppDialog>
  );
}

function AdminConfirmDialog({
  confirmLabel,
  description,
  disabled,
  onCancel,
  onConfirm,
  open,
  title,
}: {
  readonly confirmLabel: string;
  readonly description: string;
  readonly disabled?: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly open: boolean;
  readonly title: string;
}): React.JSX.Element | null {
  if (!open) return null;

  return (
    <AppDialog
      description={description}
      icon="warning"
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !disabled) onCancel();
      }}
      open={open}
      title={title}
      tone="error"
      footer={
        <>
          <Button disabled={disabled} onClick={onCancel} variant="outline">
            Hủy
          </Button>
          <Button
            className="bg-error text-on-error hover:bg-error/90"
            disabled={disabled}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="rounded-xl border border-error/15 bg-error/5 px-4 py-3 text-sm text-on-surface-variant">
        Có thể bật lại gói bằng cách chỉnh sửa và chọn trạng thái kích hoạt.
      </div>
    </AppDialog>
  );
}

function DetailItem({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}): React.JSX.Element {
  return (
    <div className="rounded border border-outline-variant bg-surface-container-low p-4">
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 break-words font-label-md text-label-md text-on-surface">
        {value}
      </p>
    </div>
  );
}
