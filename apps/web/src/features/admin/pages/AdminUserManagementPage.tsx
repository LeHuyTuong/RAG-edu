"use client";

import { AppDialog } from "@/components/ui/AppDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InputField } from "@/components/ui/InputField";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectField } from "@/components/ui/SelectField";
import { Table, type TableRow } from "@/components/ui/Table";
import type { StatusTone } from "@/types";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type AdminAccount,
  type AdminAccountRole,
  type AdminAccountStatus,
  useAdminAccounts,
  useCreateAdminAccount,
  useToggleAdminAccountBan,
} from "@/features/admin";
import {
  AdminCard,
  AdminIconAction,
  MaterialIcon,
} from "@/features/admin/components/AdminPrimitives";

interface AdminUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl?: string | null;
  readonly role: AdminAccountRole;
  readonly status: AdminAccountStatus;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly lastLogin: string;
}

/** Badge only supports status tones, not semantic UI tones. */
type BadgeStatusTone = Extract<
  StatusTone,
  "success" | "warning" | "error" | "neutral"
>;

const userColumns = [
  { key: "name", label: "Tên", sortable: true },
  { key: "email", label: "Email" },
  { key: "role", label: "Vai trò" },
  { key: "status", label: "Trạng thái" },
  { key: "actions", label: "", align: "right" as const },
] as const;

const roleLabels: Record<AdminAccountRole, string> = {
  ADMIN: "Quản trị viên",
  USER: "Người dùng",
};

const statusLabels: Record<AdminAccountStatus, string> = {
  ACTIVE: "Đang hoạt động",
  BANNED: "Đã khóa",
};

const statusTone: Record<AdminAccountStatus, BadgeStatusTone> = {
  ACTIVE: "success",
  BANNED: "error",
};

const pageSize = 6;

const formatDate = (value?: string): string => {
  if (!value) return "Chưa có dữ liệu";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) return error.message;
  return fallback;
};

const mapAccountToUser = (account: AdminAccount): AdminUser => ({
  id: account.id,
  name: account.name,
  email: account.email,
  avatarUrl: account.avatarUrl,
  role: account.role,
  status: account.status,
  createdAt: formatDate(account.createdAt),
  updatedAt: account.updatedAt ? formatDate(account.updatedAt) : undefined,
  lastLogin: "Chưa có dữ liệu",
});

const roleLabelsMap: Record<"all" | AdminAccountRole, string> = {
  all: "Tất cả vai trò",
  ADMIN: "Quản trị viên",
  USER: "Người dùng",
};

const roleValuesMap: Record<string, "all" | AdminAccountRole> = {
  "Tất cả vai trò": "all",
  "Quản trị viên": "ADMIN",
  "Người dùng": "USER",
};

const roleOptionsList = Object.values(roleLabelsMap);

const statusLabelsMap: Record<"all" | AdminAccountStatus, string> = {
  all: "Tất cả trạng thái",
  ACTIVE: "Đang hoạt động",
  BANNED: "Đã khóa",
};

const statusValuesMap: Record<string, "all" | AdminAccountStatus> = {
  "Tất cả trạng thái": "all",
  "Đang hoạt động": "ACTIVE",
  "Đã khóa": "BANNED",
};

const statusOptionsList = Object.values(statusLabelsMap);

export default function AdminUserManagementPage(): React.JSX.Element {
  const accountsQuery = useAdminAccounts();
  const createAccount = useCreateAdminAccount();
  const toggleAccountBan = useToggleAdminAccountBan();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AdminAccountRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminAccountStatus>(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [confirmBanUser, setConfirmBanUser] = useState<AdminUser | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formErrorMessage, setFormErrorMessage] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as AdminAccountRole,
  });
  const users = useMemo(
    () =>
      (accountsQuery.data ?? [])
        .filter((account) => account.role !== "ADMIN")
        .map(mapAccountToUser),
    [accountsQuery.data],
  );
  const errorMessage = accountsQuery.isError
    ? getErrorMessage(
        accountsQuery.error,
        "Không thể tải danh sách người dùng.",
      )
    : actionErrorMessage;
  const isLoading = accountsQuery.isLoading;
  const isSaving = createAccount.isPending;
  const isBanning = toggleAccountBan.isPending;

  const handleOpenAdd = useCallback(() => {
    setDraft({ name: "", email: "", password: "", role: "USER" });
    setFormErrorMessage("");
    setFormOpen(true);
  }, []);

  const handleSaveUser = async () => {
    if (!draft.name.trim() || !draft.email.trim() || !draft.password.trim()) {
      setFormErrorMessage("Vui lòng nhập đầy đủ Tên, Email và Mật khẩu.");
      return;
    }
    setFormErrorMessage("");
    try {
      await createAccount.mutateAsync({
        name: draft.name.trim(),
        email: draft.email.trim(),
        password: draft.password.trim(),
        role: draft.role,
      });
      setFormOpen(false);
    } catch (error) {
      setFormErrorMessage(getErrorMessage(error, "Không thể tạo người dùng."));
    }
  };

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("action") === "add") {
      handleOpenAdd();
      // Remove the query param so it doesn't re-open on refresh if they closed it
      window.history.replaceState({}, "", "/admin/users");
    }
  }, [handleOpenAdd, searchParams]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [query, roleFilter, statusFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleResetFilters = () => {
    setQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleOpenDetail = (user: AdminUser) => {
    setViewUser(user);
  };

  const handleBanUser = async () => {
    if (!confirmBanUser) return;
    setActionErrorMessage("");
    try {
      await toggleAccountBan.mutateAsync(confirmBanUser.id);
      setConfirmBanUser(null);
      setViewUser(null);
    } catch (error) {
      setActionErrorMessage(
        getErrorMessage(error, "Không thể khóa tài khoản."),
      );
    }
  };

  const skeletonRows: TableRow[] = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: `skeleton-${i}`,
      cells: [
        <div className="min-w-40" key="name">
          <div className="h-4 w-28 animate-pulse rounded bg-surface-variant/40" />
          <div className="mt-1 h-3 w-16 animate-pulse rounded bg-surface-variant/30" />
        </div>,
        <div
          key="email"
          className="h-4 w-48 animate-pulse rounded bg-surface-variant/40"
        />,
        <div
          key="role"
          className="h-6 w-20 animate-pulse rounded bg-surface-variant/40"
        />,
        <div
          key="status"
          className="h-6 w-24 animate-pulse rounded bg-surface-variant/40"
        />,
        <div key="actions" className="flex justify-end">
          <div className="h-8 w-20 animate-pulse rounded-lg bg-surface-variant/40" />
        </div>,
      ],
    }));
  }, []);

  const rows: TableRow[] = visibleUsers.map((user) => ({
    id: user.id,
    cells: [
      <div className="min-w-40" key="name">
        <p className="font-label-md text-label-md text-on-surface tracking-normal">
          {user.name}
        </p>
        <p className="font-label-sm text-label-sm text-on-surface-variant tracking-normal">
          Tạo ngày {user.createdAt}
        </p>
      </div>,
      <span
        className="font-body-md text-sm text-on-surface-variant"
        key="email"
      >
        {user.email}
      </span>,
      <Badge key="role" tone={user.role === "ADMIN" ? "warning" : "neutral"}>
        {roleLabels[user.role]}
      </Badge>,
      <Badge key="status" tone={statusTone[user.status]}>
        {statusLabels[user.status]}
      </Badge>,
      <div className="flex justify-end" key="actions">
        <AdminIconAction
          icon="visibility"
          label={`Xem ${user.name}`}
          onClick={() => void handleOpenDetail(user)}
        />
      </div>,
    ],
  }));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-on-surface">
            Quản lý người dùng
          </h1>
          <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Tìm kiếm, lọc trạng thái và thao tác nhanh với tài khoản hệ thống.
          </p>
        </div>
        <Button
          className="inline-flex h-[42px] items-center justify-center gap-2 self-start rounded-xl px-6"
          onClick={handleOpenAdd}
        >
          <MaterialIcon className="text-[18px]" name="person_add" />
          Thêm người dùng
        </Button>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded border border-error/30 bg-error-container px-4 py-3 font-label-sm text-label-sm text-error">
          {errorMessage}
        </div>
      ) : null}

      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_160px_160px_auto] sm:items-end">
          <SearchInput
            label="Tìm kiếm"
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
            onClear={() => {
              setQuery("");
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm người dùng..."
            value={query}
          />
          <SelectField
            label="Vai trò"
            onChange={(value) => {
              setRoleFilter(roleValuesMap[value] ?? "all");
              setCurrentPage(1);
            }}
            options={roleOptionsList}
            value={roleLabelsMap[roleFilter]}
          />
          <SelectField
            label="Trạng thái"
            onChange={(value) => {
              setStatusFilter(statusValuesMap[value] ?? "all");
              setCurrentPage(1);
            }}
            options={statusOptionsList}
            value={statusLabelsMap[statusFilter]}
          />
          <Button
            onClick={handleResetFilters}
            variant="outline"
            className="h-[42px] rounded-xl px-6"
          >
            Xóa lọc
          </Button>
        </div>
      </Card>

      <AdminCard className="w-full max-w-[calc(100vw-32px)] overflow-hidden lg:max-w-none">
        <div className="flex flex-col gap-3 border-b border-outline-variant p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-label-md text-label-md text-on-surface tracking-normal">
              Danh sách người dùng
            </h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant tracking-normal">
              {filteredUsers.length} kết quả · {users.length} tài khoản
              <Badge tone="neutral">
                Trang {currentPage}/{totalPages}
              </Badge>
            </p>
          </div>
        </div>

        {isLoading ? (
          <Table columns={userColumns} rows={skeletonRows} />
        ) : rows.length > 0 ? (
          <Table columns={userColumns} rows={rows} />
        ) : (
          <div className="p-6 font-body-md text-body-md text-on-surface-variant">
            Không có tài khoản phù hợp.
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-outline-variant p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-label-sm text-label-sm text-on-surface-variant tracking-normal">
            Hiển thị {visibleUsers.length} trên {filteredUsers.length} người
            dùng.
          </p>
          <Pagination
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalPages={totalPages}
          />
        </div>
      </AdminCard>

      <AppDialog
        description={viewUser?.email}
        icon="person"
        onOpenChange={(open) => {
          if (!open) setViewUser(null);
        }}
        open={viewUser !== null}
        title={viewUser?.name ?? "Chi tiết người dùng"}
        footer={
          viewUser ? (
            <>
              <Button onClick={() => setViewUser(null)} variant="outline">
                Đóng
              </Button>
              {viewUser.role !== "ADMIN" && viewUser.status === "ACTIVE" ? (
                <Button
                  className="bg-error text-on-error hover:bg-error/90"
                  onClick={() => setConfirmBanUser(viewUser)}
                  type="button"
                >
                  <MaterialIcon className="text-[18px]" name="block" />
                  Khóa tài khoản
                </Button>
              ) : null}
            </>
          ) : null
        }
      >
        {viewUser ? (
          <div>
            <DetailRow
              icon="manage_accounts"
              label="Vai trò"
              value={
                <Badge tone={viewUser.role === "ADMIN" ? "warning" : "neutral"}>
                  {roleLabels[viewUser.role]}
                </Badge>
              }
            />
            <DetailRow
              icon="flag"
              label="Trạng thái"
              value={
                <Badge tone={statusTone[viewUser.status]}>
                  {statusLabels[viewUser.status]}
                </Badge>
              }
            />
            <DetailRow
              icon="calendar_today"
              label="Ngày tạo"
              value={viewUser.createdAt}
            />
            <DetailRow
              icon="update"
              label="Cập nhật gần nhất"
              value={viewUser.updatedAt ?? "Chưa có dữ liệu"}
            />
          </div>
        ) : null}
      </AppDialog>

      <AppDialog
        description={
          confirmBanUser
            ? `Tài khoản ${confirmBanUser.name} sẽ chuyển sang trạng thái đã khóa.`
            : ""
        }
        icon="warning"
        onOpenChange={(open) => {
          if (!open && !isBanning) setConfirmBanUser(null);
        }}
        open={confirmBanUser !== null}
        title="Khóa người dùng"
        tone="error"
        footer={
          <>
            <Button
              disabled={isBanning}
              onClick={() => setConfirmBanUser(null)}
              variant="outline"
            >
              Hủy
            </Button>
            <Button
              className="bg-error text-on-error hover:bg-error/90"
              disabled={isBanning}
              onClick={() => void handleBanUser()}
              type="button"
            >
              {isBanning ? "Đang khóa..." : "Khóa"}
            </Button>
          </>
        }
      >
        <div className="rounded-xl border border-error/15 bg-error/5 px-4 py-3 text-sm text-on-surface-variant">
          Thao tác này sẽ ngăn người dùng đăng nhập và sử dụng hệ thống.
        </div>
      </AppDialog>

      <AppDialog
        onOpenChange={(open) => {
          if (!open && !isSaving) setFormOpen(false);
        }}
        open={formOpen}
        title="Thêm người dùng mới"
        footer={
          <>
            <Button
              disabled={isSaving}
              onClick={() => setFormOpen(false)}
              variant="outline"
            >
              Hủy
            </Button>
            <Button
              disabled={isSaving}
              onClick={() => void handleSaveUser()}
              type="button"
              variant="primary"
            >
              {isSaving ? "Đang tạo..." : "Tạo mới"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-4">
          {formErrorMessage ? (
            <div className="rounded border border-error/30 bg-error-container px-3 py-2 text-sm text-error">
              {formErrorMessage}
            </div>
          ) : null}
          <InputField
            label="Tên hiển thị"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            disabled={isSaving}
            placeholder="Ví dụ: Nguyễn Văn A"
          />
          <InputField
            label="Email"
            type="email"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            disabled={isSaving}
            placeholder="Ví dụ: nva@example.com"
          />
          <InputField
            label="Mật khẩu"
            type="password"
            value={draft.password}
            onChange={(e) => setDraft({ ...draft, password: e.target.value })}
            disabled={isSaving}
            placeholder="Tối thiểu 8 ký tự"
          />
          <SelectField
            label="Vai trò"
            options={[
              { label: "Người dùng", value: "USER" },
              { label: "Quản trị viên", value: "ADMIN" },
            ]}
            value={draft.role}
            onChange={(value) =>
              setDraft({ ...draft, role: value as AdminAccountRole })
            }
            disabled={isSaving}
          />
        </div>
      </AppDialog>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  readonly icon: string;
  readonly label: string;
  readonly value: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 py-2">
      <MaterialIcon
        className="text-[18px] text-on-surface-variant/60"
        name={icon}
      />
      <span className="w-36 shrink-0 font-label-sm text-label-sm text-on-surface-variant tracking-normal">
        {label}
      </span>
      <span className="min-w-0 flex-1 break-words font-label-md text-label-md text-on-surface tracking-normal">
        {value}
      </span>
    </div>
  );
}
