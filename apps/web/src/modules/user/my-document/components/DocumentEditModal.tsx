"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { InputField } from "@/components/ui/InputField";
import type {
  LibraryDocument,
  Subject,
  UpdateDocumentPayload,
} from "@/types/document.type";

interface Props {
  readonly document: LibraryDocument | null;
  readonly subjects: Subject[];
  readonly isOpen: boolean;
  readonly isSaving: boolean;
  readonly error: string | null;
  readonly onCancel: () => void;
  readonly onSave: (payload: UpdateDocumentPayload) => Promise<void>;
}

export function DocumentEditModal({
  document,
  subjects,
  isOpen,
  isSaving,
  error,
  onCancel,
  onSave,
}: Props): React.JSX.Element | null {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (!document) return;

    setTitle(document.title);
    setSubjectId(document.subject?.id ?? "");
    setIsPublic(document.isPublic);
  }, [document]);

  if (!isOpen || !document) return null;

  const handleSubmit = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) return;

    await onSave({
      title: nextTitle,
      subjectId: subjectId || undefined,
      isPublic,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm" />
      <form
        className="relative z-10 w-full max-w-lg rounded-2xl border border-outline-variant bg-surface p-6 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <div>
          <h3 className="text-lg font-bold text-on-surface">
            Chỉnh sửa tài liệu
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Cập nhật metadata của tài liệu trong thư viện cá nhân.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <InputField
            label="Tên tài liệu"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            disabled={isSaving}
          />

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-on-surface-variant">
              Môn học
            </span>
            <select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              disabled={isSaving}
              className="w-full rounded-xl border border-outline bg-surface py-2 pl-3 pr-8 text-sm text-on-surface focus:border-2 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Chưa phân loại</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>

          <Checkbox
            checked={isPublic}
            label="Công khai tài liệu"
            onChange={setIsPublic}
          />

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

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={onCancel}
          >
            Hủy
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
