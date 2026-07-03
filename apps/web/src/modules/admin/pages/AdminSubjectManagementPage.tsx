"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AppDialog } from "@/components/ui/AppDialog";
import { InputField } from "@/components/ui/InputField";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectField } from "@/components/ui/SelectField";
import { Table, type TableRow } from "@/components/ui/Table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createAdminSubject,
  deleteAdminSubject,
  fetchAdminSubjectDetail,
  fetchAdminSubjects,
  updateAdminSubject,
  type AdminSubject,
} from "../api";
import {
  AdminCard,
  AdminIconAction,
  MaterialIcon,
} from "../components/AdminPrimitives";

const subjectColumns = [
  { key: "code", label: "Mã môn học", sortable: true },
  { key: "name", label: "Tên môn học", sortable: true },
  { key: "createdAt", label: "Ngày tạo" },
  { key: "actions", label: "Thao tác", align: "center" as const },
] as const;

const schoolLabelsMap: Record<"all" | "FPTU", string> = {
  all: "Tất cả trường",
  FPTU: "FPT University",
};

const schoolValuesMap: Record<string, "all" | "FPTU"> = {
  "Tất cả trường": "all",
  "FPT University": "FPTU",
};

const schoolOptionsList = Object.values(schoolLabelsMap);

interface SubjectDraft {
  readonly name: string;
  readonly code: string;
}

const emptyDraft: SubjectDraft = {
  name: "",
  code: "",
};

const pageSize = 10;

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

export default function AdminSubjectManagementPage(): React.JSX.Element {
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [query, setQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<"all" | "FPTU">("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<AdminSubject | null>(null);
  const [viewSubject, setViewSubject] = useState<AdminSubject | null>(null);
  const [deleteSubject, setDeleteSubject] = useState<AdminSubject | null>(null);

  const [draft, setDraft] = useState<SubjectDraft>(emptyDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formErrorMessage, setFormErrorMessage] = useState("");

  const loadSubjects = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetchAdminSubjects({
        page: currentPage,
        limit: pageSize,
        search: query.trim() || undefined,
      });

      setSubjects(response.subjects as AdminSubject[]);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Không thể tải danh sách môn học."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, query]);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  const handleResetFilters = () => {
    setQuery("");
    setSchoolFilter("all");
    setCurrentPage(1);
  };

  const handleOpenAdd = () => {
    setEditSubject(null);
    setDraft(emptyDraft);
    setFormErrorMessage("");
    setFormOpen(true);
  };

  const handleOpenEdit = (subject: AdminSubject) => {
    setEditSubject(subject);
    setDraft({
      name: subject.name,
      code: subject.code,
    });
    setFormErrorMessage("");
    setFormOpen(true);
  };

  const handleOpenDetail = async (subject: AdminSubject) => {
    setIsDetailLoading(true);
    setErrorMessage("");

    try {
      const detailed = await fetchAdminSubjectDetail(subject.id);
      setViewSubject(detailed);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Không thể tải chi tiết môn học."),
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSaveSubject = async () => {
    if (!draft.name.trim() || !draft.code.trim()) {
      setFormErrorMessage("Vui lòng nhập đầy đủ tên và mã môn học.");
      return;
    }

    setIsSaving(true);
    setFormErrorMessage("");

    try {
      if (editSubject) {
        // Update subject
        await updateAdminSubject(editSubject.id, {
          name: draft.name.trim(),
          code: draft.code.trim().toUpperCase(),
        });
      } else {
        // Create subject
        await createAdminSubject({
          name: draft.name.trim(),
          code: draft.code.trim().toUpperCase(),
          schoolId: "school-fptu",
        });
      }

      toast.success(
        editSubject
          ? "Cập nhật môn học thành công!"
          : "Tạo môn học mới thành công!",
      );
      setFormOpen(false);
      setDraft(emptyDraft);
      setEditSubject(null);
      setCurrentPage(1);
      await loadSubjects();
    } catch (error) {
      setFormErrorMessage(
        getErrorMessage(
          error,
          editSubject
            ? "Không thể cập nhật môn học."
            : "Không thể tạo môn học.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deleteSubject) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      await deleteAdminSubject(deleteSubject.id);
      toast.success("Xóa môn học thành công!");
      setDeleteSubject(null);
      setCurrentPage(1);
      await loadSubjects();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Không thể xóa môn học."));
    } finally {
      setIsDeleting(false);
    }
  };

  const skeletonRows: TableRow[] = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: `skeleton-${i}`,
      cells: [
        <div
          key="code"
          className="h-5 w-24 animate-pulse rounded bg-surface-variant/40"
        />,
        <div
          key="name"
          className="h-5 w-48 animate-pulse rounded bg-surface-variant/40"
        />,
        <div
          key="createdAt"
          className="h-5 w-32 animate-pulse rounded bg-surface-variant/40"
        />,
        <div key="actions" className="flex justify-center gap-1.5 py-1">
          <div className="h-7 w-7 animate-pulse rounded-lg bg-surface-variant/40" />
          <div className="h-7 w-7 animate-pulse rounded-lg bg-surface-variant/40" />
          <div className="h-7 w-7 animate-pulse rounded-lg bg-surface-variant/40" />
        </div>,
      ],
    }));
  }, []);

  const rows: TableRow[] = subjects.map((subject) => {
    return {
      id: subject.id,
      cells: [
        <span
          className="font-mono text-sm font-semibold text-primary"
          key="code"
        >
          {subject.code}
        </span>,
        <span
          className="font-label-md text-label-md text-on-surface tracking-normal"
          key="name"
        >
          {subject.name}
        </span>,
        <span
          className="font-body-md text-sm text-on-surface-variant"
          key="createdAt"
        >
          {formatDate(subject.createdAt)}
        </span>,
        <div className="flex justify-center gap-1" key="actions">
          <AdminIconAction
            icon="visibility"
            label={`Xem ${subject.name}`}
            onClick={() => void handleOpenDetail(subject)}
          />
        </div>,
      ],
    };
  });

  return (
    <div className="relative">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-on-surface">
            Quản lý môn học
          </h1>
          <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Xem danh sách môn học, tìm kiếm, lọc theo trường và cập nhật thông
            tin môn học hệ thống.
          </p>
        </div>
        <Button
          className="inline-flex items-center justify-center gap-2 self-start h-[42px] rounded-xl px-6"
          onClick={handleOpenAdd}
        >
          <MaterialIcon className="text-[18px]" name="add" />
          Thêm môn học mới
        </Button>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded border border-error/30 bg-error-container px-4 py-3 font-label-sm text-label-sm text-error">
          {errorMessage}
        </div>
      ) : null}

      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,1fr)_220px_auto] lg:items-end">
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
            placeholder="Tìm theo mã hoặc tên môn học..."
            value={query}
          />
          <SelectField
            label="Trường học"
            onChange={(value) => {
              setSchoolFilter(schoolValuesMap[value] ?? "all");
              setCurrentPage(1);
            }}
            options={schoolOptionsList}
            value={schoolLabelsMap[schoolFilter]}
          />
          <Button
            onClick={handleResetFilters}
            variant="outline"
            className="h-[42px] rounded-xl px-6"
          >
            Xóa bộ lọc
          </Button>
        </div>
      </Card>

      <AdminCard className="w-full max-w-[calc(100vw-32px)] overflow-hidden lg:max-w-none">
        <div className="flex flex-col gap-3 border-b border-outline-variant p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-label-md text-label-md text-on-surface tracking-normal">
              Danh sách môn học
            </h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant tracking-normal">
              {totalItems} kết quả hiện có
            </p>
          </div>
          <Badge tone="neutral">
            Trang {currentPage}/{totalPages}
          </Badge>
        </div>

        {isLoading ? (
          <Table columns={subjectColumns} rows={skeletonRows} />
        ) : rows.length > 0 ? (
          <Table columns={subjectColumns} rows={rows} />
        ) : (
          <div className="p-6 font-body-md text-body-md text-on-surface-variant">
            Không tìm thấy môn học nào phù hợp.
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-outline-variant p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-label-sm text-label-sm text-on-surface-variant tracking-normal">
            Hiển thị {subjects.length} trên {totalItems} môn học.
          </p>
          <Pagination
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalPages={totalPages}
          />
        </div>
      </AdminCard>

      {formOpen ? (
        <SubjectFormDialog
          draft={draft}
          errorMessage={formErrorMessage}
          isSaving={isSaving}
          isUpdate={editSubject !== null}
          onCancel={() => {
            setFormOpen(false);
            setEditSubject(null);
            setDraft(emptyDraft);
            setFormErrorMessage("");
          }}
          onChange={setDraft}
          onSave={handleSaveSubject}
        />
      ) : null}

      {viewSubject ? (
        <SubjectDetailDialog
          onDelete={() => {
            setDeleteSubject(viewSubject);
            setViewSubject(null);
          }}
          onEdit={() => {
            handleOpenEdit(viewSubject);
            setViewSubject(null);
          }}
          onClose={() => setViewSubject(null)}
          subject={viewSubject}
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
        confirmLabel={isDeleting ? "Đang xóa..." : "Xóa"}
        description={
          deleteSubject
            ? `Môn học ${deleteSubject.name} (${deleteSubject.code}) sẽ bị xóa hoàn toàn khỏi hệ thống.`
            : ""
        }
        disabled={isDeleting}
        onCancel={() => setDeleteSubject(null)}
        onConfirm={() => void handleDeleteSubject()}
        open={deleteSubject !== null}
        title="Xóa môn học"
      />
    </div>
  );
}

function SubjectFormDialog({
  draft,
  errorMessage,
  isSaving,
  isUpdate,
  onCancel,
  onChange,
  onSave,
}: {
  readonly draft: SubjectDraft;
  readonly errorMessage: string;
  readonly isSaving: boolean;
  readonly isUpdate: boolean;
  readonly onCancel: () => void;
  readonly onChange: (draft: SubjectDraft) => void;
  readonly onSave: () => void;
}): React.JSX.Element {
  const canSave =
    draft.name.trim().length > 0 && draft.code.trim().length > 0 && !isSaving;

  return (
    <AppDialog
      description={
        isUpdate
          ? "Thay đổi thông tin môn học hiện có"
          : "Thêm môn học mới vào hệ thống"
      }
      icon={isUpdate ? "edit" : "add"}
      onOpenChange={(open) => {
        if (!open && !isSaving) onCancel();
      }}
      open
      title={isUpdate ? "Cập nhật môn học" : "Thêm môn học"}
      footer={
        <>
          <Button disabled={isSaving} onClick={onCancel} variant="outline">
            Hủy
          </Button>
          <Button disabled={!canSave} onClick={onSave}>
            {isSaving
              ? "Đang lưu..."
              : isUpdate
                ? "Lưu thay đổi"
                : "Tạo môn học"}
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
        <div className="grid grid-cols-1 gap-4">
          <InputField
            label="Mã môn học"
            onChange={(event) =>
              onChange({ ...draft, code: event.target.value })
            }
            placeholder="Ví dụ: MATH, PHYS, CS"
            required
            value={draft.code}
          />
          <InputField
            label="Tên môn học"
            onChange={(event) =>
              onChange({ ...draft, name: event.target.value })
            }
            placeholder="Ví dụ: Toán học, Vật lý"
            required
            value={draft.name}
          />
        </div>
      </div>
    </AppDialog>
  );
}

function SubjectDetailDialog({
  subject,
  onClose,
  onEdit,
  onDelete,
}: {
  readonly subject: AdminSubject;
  readonly onClose: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}): React.JSX.Element {
  return (
    <AppDialog
      description={
        <span className="font-mono text-primary">Mã: {subject.code}</span>
      }
      icon="visibility"
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open
      title={subject.name}
      footer={
        <>
          <Button
            className="text-error hover:bg-error/10 hover:text-error"
            onClick={onDelete}
            type="button"
            variant="ghost"
          >
            <MaterialIcon className="text-[18px]" name="delete" />
            Xóa môn học
          </Button>
          <div className="flex gap-3">
            <Button onClick={onClose} type="button" variant="outline">
              Đóng
            </Button>
            <Button onClick={onEdit} type="button">
              <MaterialIcon className="text-[18px]" name="edit" />
              Sửa môn học
            </Button>
          </div>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailItem label="Mã môn học" value={subject.code} />
        <DetailItem label="Tên môn học" value={subject.name} />
        <DetailItem label="Ngày tạo" value={formatDate(subject.createdAt)} />
        <DetailItem
          label="Cập nhật gần nhất"
          value={
            subject.updatedAt ? formatDate(subject.updatedAt) : "Chưa cập nhật"
          }
        />
      </div>
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
  if (!open) {
    return null;
  }

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
        Thao tác này không thể hoàn tác nếu môn học đã được xóa khỏi hệ thống.
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
      <p className="font-label-sm text-label-sm text-on-surface-variant tracking-normal">
        {label}
      </p>
      <p className="mt-1 break-words font-label-md text-label-md text-on-surface tracking-normal">
        {value}
      </p>
    </div>
  );
}
