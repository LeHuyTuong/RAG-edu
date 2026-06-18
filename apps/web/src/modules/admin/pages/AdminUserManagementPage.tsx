"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InputField } from "@/components/ui/InputField";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectField } from "@/components/ui/SelectField";
import { Table, type TableRow } from "@/components/ui/Table";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  banAdminAccount,
  createAdminAccount,
  fetchAdminAccountDetail,
  fetchAdminAccounts,
  type AdminAccount,
} from "../api";
import {
  AdminCard,
  AdminIconAction,
  MaterialIcon,
} from "../components/AdminPrimitives";
import type { AdminUser, AdminUserRole, AdminUserStatus } from "../types";

const userColumns = [
  { key: "name", label: "Tên", sortable: true },
  { key: "email", label: "Email" },
  { key: "role", label: "Vai trò" },
  { key: "status", label: "Trạng thái" },
  { key: "actions", label: "Thao tác", align: "center" as const },
] as const;

const roleLabels: Record<AdminUserRole, string> = {
  ADMIN: "Quản trị viên",
  MODERATOR: "Kiểm duyệt viên",
  USER: "Người dùng",
};

const statusLabels: Record<AdminUserStatus, string> = {
  ACTIVE: "Đang hoạt động",
  UNVERIFIED: "Chưa xác thực",
  BANNED: "Đã khóa",
  DELETED: "Đã xóa",
};

const statusTone: Record<
  AdminUserStatus,
  "success" | "warning" | "error" | "neutral"
> = {
  ACTIVE: "success",
  UNVERIFIED: "warning",
  BANNED: "error",
  DELETED: "neutral",
};

interface UserDraft {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly avatarUrl: string;
}

const emptyDraft: UserDraft = {
  name: "",
  email: "",
  password: "",
  avatarUrl: "",
};

const pageSize = 6;

const formatDate = (value?: string): string => {
  if (!value) {
    return "Chưa có dữ liệu";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message;
  }

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

const roleLabelsMap: Record<"all" | AdminUserRole, string> = {
  all: "Tất cả vai trò",
  ADMIN: "Quản trị viên",
  MODERATOR: "Kiểm duyệt viên",
  USER: "Người dùng",
};

const roleValuesMap: Record<string, "all" | AdminUserRole> = {
  "Tất cả vai trò": "all",
  "Quản trị viên": "ADMIN",
  "Kiểm duyệt viên": "MODERATOR",
  "Người dùng": "USER",
};

const roleOptionsList = Object.values(roleLabelsMap);

const statusLabelsMap: Record<"all" | AdminUserStatus, string> = {
  all: "Tất cả trạng thái",
  ACTIVE: "Đang hoạt động",
  UNVERIFIED: "Chưa xác thực",
  BANNED: "Đã khóa",
  DELETED: "Đã xóa",
};

const statusValuesMap: Record<string, "all" | AdminUserStatus> = {
  "Tất cả trạng thái": "all",
  "Đang hoạt động": "ACTIVE",
  "Chưa xác thực": "UNVERIFIED",
  "Đã khóa": "BANNED",
  "Đã xóa": "DELETED",
};

const statusOptionsList = Object.values(statusLabelsMap);

export default function AdminUserManagementPage(): React.JSX.Element {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AdminUserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminUserStatus>(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [banUser, setBanUser] = useState<AdminUser | null>(null);
  const [draft, setDraft] = useState<UserDraft>(emptyDraft);
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formErrorMessage, setFormErrorMessage] = useState("");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const accounts = await fetchAdminAccounts({
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
      });
      setUsers(
        accounts
          .filter((account) => account.role !== "ADMIN")
          .map(mapAccountToUser),
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Không thể tải danh sách người dùng."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [createdFrom, createdTo]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

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
    setCreatedFrom("");
    setCreatedTo("");
    setCurrentPage(1);
  };

  const handleOpenAdd = () => {
    setDraft(emptyDraft);
    setFormErrorMessage("");
    setFormOpen(true);
  };

  const handleOpenDetail = async (user: AdminUser) => {
    setIsDetailLoading(true);
    setErrorMessage("");

    try {
      const account = await fetchAdminAccountDetail(user.id);
      setViewUser(mapAccountToUser(account));
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Không thể tải chi tiết tài khoản."),
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (
      !draft.name.trim() ||
      !draft.email.trim() ||
      draft.password.trim().length < 8
    ) {
      setFormErrorMessage(
        "Vui lòng nhập tên, email và mật khẩu ít nhất 8 ký tự.",
      );
      return;
    }

    setIsSaving(true);
    setFormErrorMessage("");

    try {
      await createAdminAccount({
        name: draft.name.trim(),
        email: draft.email.trim(),
        password: draft.password,
        avatarUrl: draft.avatarUrl.trim() || undefined,
        role: "MODERATOR",
        status: "ACTIVE",
      });
      setDraft(emptyDraft);
      setFormOpen(false);
      setCurrentPage(1);
      await loadUsers();
    } catch (error) {
      setFormErrorMessage(getErrorMessage(error, "Không thể tạo tài khoản."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleBanUser = async () => {
    if (!banUser) {
      return;
    }

    setIsBanning(true);
    setErrorMessage("");

    try {
      await banAdminAccount(banUser.id);
      setUsers((current) =>
        current.map((user) =>
          user.id === banUser.id ? { ...user, status: "BANNED" } : user,
        ),
      );
      setBanUser(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Không thể khóa tài khoản."));
    } finally {
      setIsBanning(false);
    }
  };

  const rows: TableRow[] = visibleUsers.map((user) => {
    const canBanUser = user.role !== "ADMIN" && user.status === "ACTIVE";

    return {
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
        <div className="flex justify-center gap-1" key="actions">
          <AdminIconAction
            icon="visibility"
            label={`Xem ${user.name}`}
            onClick={() => void handleOpenDetail(user)}
          />
          {canBanUser ? (
            <AdminIconAction
              icon="block"
              label={`Khóa ${user.name}`}
              onClick={() => setBanUser(user)}
              tone="error"
            />
          ) : null}
        </div>,
      ],
    };
  });

  return (
    <div className="relative">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-on-surface">
            Quản lý người dùng
          </h1>
          <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Tìm kiếm, lọc trạng thái và thao tác nhanh với tài khoản hệ thống.
          </p>
        </div>
        <Button
          className="inline-flex items-center justify-center gap-2 self-start h-[42px] rounded-xl px-6"
          onClick={handleOpenAdd}
        >
          <MaterialIcon className="text-[18px]" name="person_add" />
          Thêm kiểm duyệt viên
        </Button>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded border border-error/30 bg-error-container px-4 py-3 font-label-sm text-label-sm text-error">
          {errorMessage}
        </div>
      ) : null}

      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,1fr)_180px_180px_180px_180px_auto] lg:items-end">
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
          <InputField
            label="Tạo từ ngày"
            onChange={(event) => {
              setCreatedFrom(event.target.value);
              setCurrentPage(1);
            }}
            type="date"
            value={createdFrom}
          />
          <InputField
            label="Tạo đến ngày"
            onChange={(event) => {
              setCreatedTo(event.target.value);
              setCurrentPage(1);
            }}
            type="date"
            value={createdTo}
          />
          <Button onClick={handleResetFilters} variant="outline">
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
            </p>
          </div>
          <Badge tone="neutral">
            Trang {currentPage}/{totalPages}
          </Badge>
        </div>
        {isLoading ? (
          <div className="p-6 font-body-md text-body-md text-on-surface-variant">
            Đang tải danh sách người dùng...
          </div>
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

      {formOpen ? (
        <UserFormDialog
          draft={draft}
          errorMessage={formErrorMessage}
          isSaving={isSaving}
          onCancel={() => {
            setFormOpen(false);
            setDraft(emptyDraft);
            setFormErrorMessage("");
          }}
          onChange={setDraft}
          onSave={handleSaveUser}
        />
      ) : null}

      {viewUser ? (
        <UserDetailDialog onClose={() => setViewUser(null)} user={viewUser} />
      ) : null}

      {isDetailLoading ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-inverse-surface/20 px-4 py-8">
          <div className="rounded border border-outline-variant bg-surface-container-lowest px-5 py-3 font-label-md text-label-md text-on-surface">
            Đang tải chi tiết...
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        confirmLabel={isBanning ? "Đang khóa..." : "Khóa"}
        description={
          banUser
            ? `Tài khoản ${banUser.name} sẽ chuyển sang trạng thái đã khóa.`
            : ""
        }
        disabled={isBanning}
        onCancel={() => setBanUser(null)}
        onConfirm={() => void handleBanUser()}
        open={banUser !== null}
        title="Khóa người dùng"
      />
    </div>
  );
}

function UserFormDialog({
  draft,
  errorMessage,
  isSaving,
  onCancel,
  onChange,
  onSave,
}: {
  readonly draft: UserDraft;
  readonly errorMessage: string;
  readonly isSaving: boolean;
  readonly onCancel: () => void;
  readonly onChange: (draft: UserDraft) => void;
  readonly onSave: () => void;
}): React.JSX.Element {
  const canSave =
    draft.name.trim().length > 0 &&
    draft.email.trim().length > 0 &&
    draft.password.trim().length >= 8 &&
    !isSaving;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-inverse-surface/35 px-4 py-8">
      <button
        aria-label="Đóng form người dùng"
        className="absolute inset-0"
        onClick={onCancel}
        type="button"
      />
      <div className="relative z-10 w-full max-w-2xl rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-normal text-on-surface">
              Thêm người dùng
            </h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant tracking-normal">
              Tài khoản kiểm duyệt viên mới
            </p>
          </div>
          <button
            aria-label="Đóng"
            className="rounded p-2 text-on-surface-variant hover:bg-surface-container-high"
            onClick={onCancel}
            type="button"
          >
            <MaterialIcon name="close" />
          </button>
        </div>
        {errorMessage ? (
          <p className="mb-4 rounded border border-error/30 bg-error-container px-4 py-3 font-label-sm text-label-sm text-error">
            {errorMessage}
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            label="Tên"
            onChange={(event) =>
              onChange({ ...draft, name: event.target.value })
            }
            required
            value={draft.name}
          />
          <InputField
            label="Email"
            onChange={(event) =>
              onChange({ ...draft, email: event.target.value })
            }
            required
            type="email"
            value={draft.email}
          />
          <InputField
            label="Mật khẩu"
            minLength={8}
            onChange={(event) =>
              onChange({ ...draft, password: event.target.value })
            }
            required
            type="password"
            value={draft.password}
          />
          <InputField
            label="Avatar URL"
            onChange={(event) =>
              onChange({ ...draft, avatarUrl: event.target.value })
            }
            type="url"
            value={draft.avatarUrl}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-outline-variant pt-4">
          <Button disabled={isSaving} onClick={onCancel} variant="ghost">
            Hủy
          </Button>
          <Button disabled={!canSave} onClick={onSave}>
            {isSaving ? "Đang tạo..." : "Tạo kiểm duyệt viên"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserDetailDialog({
  user,
  onClose,
}: {
  readonly user: AdminUser;
  readonly onClose: () => void;
}): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-inverse-surface/35 px-4 py-8">
      <button
        aria-label="Đóng chi tiết người dùng"
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-normal text-on-surface">
              {user.name}
            </h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant tracking-normal">
              {user.email}
            </p>
          </div>
          <button
            aria-label="Đóng"
            className="rounded p-2 text-on-surface-variant hover:bg-surface-container-high"
            onClick={onClose}
            type="button"
          >
            <MaterialIcon name="close" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailItem label="Vai trò" value={roleLabels[user.role]} />
          <DetailItem label="Trạng thái" value={statusLabels[user.status]} />
          <DetailItem label="Ngày tạo" value={user.createdAt} />
          <DetailItem
            label="Cập nhật gần nhất"
            value={user.updatedAt ?? "Chưa có dữ liệu"}
          />
          <DetailItem label="Avatar" value={user.avatarUrl ?? "Chưa có"} />
        </div>
      </div>
    </div>
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
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-inverse-surface/35 px-4 py-8">
      <button
        aria-label="Đóng hộp thoại xác nhận"
        className="absolute inset-0"
        disabled={disabled}
        onClick={onCancel}
        type="button"
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
        <div className="mb-6 flex items-start gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded bg-error-container text-error">
            <MaterialIcon name="warning" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-normal text-on-surface">
              {title}
            </h2>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              {description}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
          <Button disabled={disabled} onClick={onCancel} variant="ghost">
            Hủy
          </Button>
          <button
            className="rounded bg-error px-6 py-2 font-label-md text-label-md text-on-error transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
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
      <p className="font-label-sm text-label-sm text-on-surface-variant tracking-normal">
        {label}
      </p>
      <p className="mt-1 break-words font-label-md text-label-md text-on-surface tracking-normal">
        {value}
      </p>
    </div>
  );
}
