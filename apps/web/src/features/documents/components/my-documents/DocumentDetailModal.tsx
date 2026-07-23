"use client";

import { useEffect, useMemo, useState } from "react";

import { AppDialog } from "@/components/ui/AppDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { InputField } from "@/components/ui/InputField";
import { SelectField } from "@/components/ui/SelectField";
import type {
  LibraryDocument,
  Subject,
  UpdateDocumentPayload,
} from "@/types/document.type";
import { formatDate } from "@/utils";
import { getDisplayFromStatus } from "@/shared/documentStatus";

import { useFolderOptions } from "../../hooks/use-folder-options";

type DialogMode = "view" | "edit" | "delete";

interface Props {
  readonly document: LibraryDocument | null;
  readonly subjects: Subject[];
  readonly isOpen: boolean;
  readonly isSaving: boolean;
  readonly deletingId: string | null;
  readonly error: string | null;
  readonly initialMode?: DialogMode;
  readonly onCancel: () => void;
  readonly onDelete: (document: LibraryDocument) => void;
  readonly onSave: (
    document: LibraryDocument,
    payload: UpdateDocumentPayload,
  ) => Promise<void> | void;
}

function getStatusDisplay(document: LibraryDocument) {
  return getDisplayFromStatus(
    document.status,
    document.ragStatus,
    document.isPublic,
  );
}

function DetailItem({
  label,
  value,
}: {
  readonly label: string;
  readonly value: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold text-on-surface">
        {value}
      </div>
    </div>
  );
}

export function DocumentDetailModal({
  document,
  subjects,
  isOpen,
  isSaving,
  deletingId,
  error,
  initialMode,
  onCancel,
  onDelete,
  onSave,
}: Props): React.JSX.Element | null {
  const [mode, setMode] = useState<DialogMode>("view");
  const [title, setTitle] = useState("");
  const [originalAuthor, setOriginalAuthor] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [folderId, setFolderId] = useState("");
  const { data: folders = [] } = useFolderOptions();

  useEffect(() => {
    if (!document) return;

    setMode(initialMode ?? "view");
    setTitle(document.title);
    setOriginalAuthor(document.originalAuthor ?? "");
    setSubjectId(document.subject?.id ?? "");
    setIsPublic(document.isPublic);
    setFolderId(document.folderId ? String(document.folderId) : "");
  }, [document, initialMode]);

  const subjectOptions = useMemo(
    () => [
      { label: "Chưa phân loại", value: "" },
      ...subjects.map((subject) => ({
        label: subject.name,
        value: subject.id,
      })),
    ],
    [subjects],
  );

  const folderOptions = useMemo(
    () => [
      { label: "Không có thư mục", value: "" },
      ...folders.map((folder) => ({
        label: folder.folderName,
        value: String(folder.id),
      })),
    ],
    [folders],
  );

  if (!isOpen || !document) return null;

  const status = getStatusDisplay(document);
  const isDeleting = deletingId === document.id;
  const selectedFolderName =
    folders.find((folder) => String(folder.id) === String(document.folderId))
      ?.folderName ??
    (document.folderId ? `Thư mục #${document.folderId}` : "Không có thư mục");

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    if (isSaving || isDeleting) return;
    onCancel();
  };

  const handleSubmit = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) return;

    await onSave(document, {
      title: nextTitle,
      originalAuthor: originalAuthor.trim() || undefined,
      subjectId: subjectId || undefined,
      isPublic,
      folderId: folderId ? Number(folderId) : undefined,
    });
  };

  if (mode === "edit") {
    return (
      <AppDialog
        bodyClassName="min-h-0 flex-1 space-y-5 overflow-y-auto"
        description={document.title}
        icon="edit_document"
        onOpenChange={handleOpenChange}
        open={isOpen}
        title="Chỉnh sửa tài liệu"
        footer={
          <>
            <Button
              disabled={isSaving}
              onClick={() => setMode("view")}
              type="button"
              variant="outline"
            >
              Hủy
            </Button>
            <Button
              disabled={isSaving}
              onClick={() => void handleSubmit()}
              type="button"
              variant="primary"
            >
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <InputField
            disabled={isSaving}
            label="Tên tài liệu"
            onChange={(event) => setTitle(event.target.value)}
            required
            value={title}
          />

          <InputField
            disabled={isSaving}
            label="Tác giả gốc (nếu có)"
            onChange={(event) => setOriginalAuthor(event.target.value)}
            placeholder="Tên người/tổ chức tạo ra nội dung gốc của tài liệu"
            value={originalAuthor}
            maxLength={255}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              disabled={isSaving}
              label="Môn học"
              onChange={setSubjectId}
              options={subjectOptions}
              placeholder="Chưa phân loại"
              value={subjectId}
            />

            <SelectField
              disabled={isSaving}
              label="Thư mục"
              onChange={setFolderId}
              options={folderOptions}
              placeholder="Không có thư mục"
              value={folderId}
            />
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
            <Checkbox
              checked={isPublic}
              label="Công khai tài liệu"
              onChange={setIsPublic}
            />
          </div>

          {isPublic && !document.isPublic ? (
            <p className="rounded-xl border border-warning/30 bg-warning-container/40 p-3 text-sm text-on-surface-variant">
              Tài liệu riêng tư khi chuyển sang công khai sẽ được đưa vào trạng
              thái chờ duyệt.
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-error/40 bg-error-container/30 p-3 text-sm text-error">
              {error}
            </p>
          ) : null}
        </div>
      </AppDialog>
    );
  }

  if (mode === "delete") {
    return (
      <AppDialog
        description={
          <>
            Bạn sắp xóa vĩnh viễn tài liệu{" "}
            <span className="font-semibold text-on-surface">
              {document.title}
            </span>
            .
          </>
        }
        icon="delete_forever"
        onOpenChange={handleOpenChange}
        open={isOpen}
        title="Chuyển vào thùng rác?"
        tone="neutral"
        footer={
          <>
            <Button
              disabled={isDeleting}
              onClick={() => setMode("view")}
              type="button"
              variant="outline"
            >
              Hủy
            </Button>
            <Button
              disabled={isDeleting}
              onClick={() => onDelete(document)}
              type="button"
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {isDeleting ? "Đang xóa..." : "Chuyển vào thùng rác"}
            </Button>
          </>
        }
      >
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
          Tài liệu sẽ được chuyển vào thùng rác. Bạn có thể khôi phục lại bất kỳ
          lúc nào.
        </div>
      </AppDialog>
    );
  }

  return (
    <AppDialog
      description={document.title}
      icon="visibility"
      onOpenChange={handleOpenChange}
      open={isOpen}
      title="Chi tiết tài liệu"
      footer={
        <>
          <Button
            className="text-error hover:bg-error/10 hover:text-error"
            disabled={isDeleting || isSaving}
            onClick={() => setMode("delete")}
            type="button"
            variant="ghost"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[18px]"
            >
              delete
            </span>
            Xóa tài liệu
          </Button>
          <div className="flex gap-3">
            <Button onClick={onCancel} type="button" variant="outline">
              Đóng
            </Button>
            <Button onClick={() => setMode("edit")} type="button">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[18px]"
              >
                edit
              </span>
              Sửa tài liệu
            </Button>
          </div>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem label="Tên tài liệu" value={document.title} />
          <DetailItem
            label="Tác giả gốc"
            value={document.originalAuthor || "Chưa cập nhật"}
          />
          <DetailItem
            label="Môn học"
            value={document.subject?.name ?? "Chưa phân loại"}
          />
          <DetailItem
            label="Ngày tải lên"
            value={formatDate(document.createdAt)}
          />
          <DetailItem
            label="Trạng thái"
            value={<Badge tone={status.tone}>{status.label}</Badge>}
          />
          <DetailItem label="Thư mục" value={selectedFolderName} />
          <DetailItem
            label="Hiển thị"
            value={document.isPublic ? "Công khai" : "Riêng tư"}
          />
        </div>

        {document.rejectionReason ? (
          <div className="rounded-xl border border-error/15 bg-error/5 px-4 py-3">
            <p className="text-xs font-medium text-error">Lý do từ chối</p>
            <p className="mt-2 text-sm font-medium text-on-surface">
              {document.rejectionReason}
            </p>
          </div>
        ) : null}
      </div>
    </AppDialog>
  );
}
