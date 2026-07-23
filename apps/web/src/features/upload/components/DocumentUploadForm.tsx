"use client";

import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { SelectField } from "@/components/ui/SelectField";
import type { Subject } from "@/types/document.type";

import type { UploadFormValues } from "../hooks/use-upload-form";

interface Props {
  readonly values: UploadFormValues;
  readonly hasSelectedFile: boolean;
  readonly setField: <Field extends keyof UploadFormValues>(
    field: Field,
    value: UploadFormValues[Field],
  ) => void;
  readonly subjects: Subject[];
  readonly folders: Array<{ id: number; folderName: string }>;
  readonly isLoadingSubjects: boolean;
  readonly isSubmitting: boolean;
  readonly submitError: string | null;
  readonly onSubmit: () => void;
}

export function DocumentUploadForm({
  values,
  hasSelectedFile,
  setField,
  subjects,
  folders,
  isLoadingSubjects,
  isSubmitting,
  submitError,
  onSubmit,
}: Props): React.JSX.Element {
  const subjectOptions = [
    { label: "Chọn giai đoạn lịch sử", value: "" },
    ...subjects.map((subject) => ({
      label: subject.name,
      value: subject.id,
    })),
  ];
  const folderOptions = [
    { label: "Không có thư mục", value: "" },
    ...folders.map((folder) => ({
      label: folder.folderName,
      value: String(folder.id),
    })),
  ];

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="space-y-5"
      noValidate
    >
      <InputField
        disabled={isSubmitting}
        label="Tên tài liệu"
        onChange={(event) => setField("title", event.target.value)}
        placeholder="Ví dụ: Chiến dịch Điện Biên Phủ (1954)"
        required
        value={values.title}
      />

      <SelectField
        disabled={isLoadingSubjects || isSubmitting}
        label="Giai đoạn lịch sử"
        onChange={(value) => setField("subjectId", value)}
        options={subjectOptions}
        placeholder="Chọn giai đoạn lịch sử"
        value={values.subjectId}
      />

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-on-surface-variant">
          Mô tả chi tiết
        </span>
        <textarea
          className="
            w-full resize-none rounded-xl border border-outline bg-surface
            p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60
            focus:border-2 focus:border-primary focus:outline-none
            disabled:cursor-not-allowed disabled:opacity-50
          "
          disabled={isSubmitting}
          onChange={(event) => setField("description", event.target.value)}
          placeholder="Mô tả ngắn về nội dung, bối cảnh hoặc sự kiện lịch sử trong tài liệu..."
          rows={4}
          value={values.description}
        />
      </label>

      <InputField
        disabled={isSubmitting}
        label="Tác giả gốc (nếu có)"
        maxLength={255}
        onChange={(event) => setField("originalAuthor", event.target.value)}
        placeholder="Tên người/tổ chức tạo ra nội dung gốc của tài liệu"
        value={values.originalAuthor}
      />

      {folders.length > 0 ? (
        <SelectField
          disabled={isSubmitting}
          label="Thư mục"
          onChange={(value) => setField("folderId", value)}
          options={folderOptions}
          placeholder="Không có thư mục"
          value={values.folderId}
        />
      ) : null}

      <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-on-surface">
            Công khai tư liệu
          </span>
          <span className="text-xs text-on-surface-variant">
            {values.isPublic
              ? "Cộng đồng có thể tìm và tham khảo tư liệu này."
              : "Công khai để cộng đồng có thể tham khảo"}
          </span>
        </div>

        <button
          aria-checked={values.isPublic}
          aria-label="Công khai tài liệu"
          className={
            "\n            relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200\n            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary\n            disabled:cursor-not-allowed disabled:opacity-50\n            " +
            (values.isPublic ? "bg-primary" : "bg-outline")
          }
          disabled={isSubmitting}
          onClick={() => setField("isPublic", !values.isPublic)}
          role="switch"
          type="button"
        >
          <span
            className="pointer-events-none absolute h-5 w-5 rounded-full bg-surface shadow-sm transition-all duration-200 ease-out"
            style={{ left: values.isPublic ? "22px" : "2px" }}
          />
        </button>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <p className="text-xs font-semibold text-on-surface mb-1">
          Quy tắc lưu trữ tài liệu lịch sử
        </p>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Bằng cách tải lên, bạn xác nhận tài liệu có nguồn gốc rõ ràng và không
          vi phạm bản quyền.
        </p>
      </div>

      {!hasSelectedFile ? (
        <p className="flex items-center gap-1 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">info</span>
          Chọn tệp bên trái trước, sau đó nhấn lưu.
        </p>
      ) : null}

      {submitError ? (
        <div className="flex items-start gap-2 rounded-xl border border-error/40 bg-error-container/30 p-3 text-sm text-error">
          <span className="material-symbols-outlined shrink-0 text-[18px]">
            error
          </span>
          {submitError}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button
          className="w-full sm:w-auto"
          disabled={!hasSelectedFile || isSubmitting}
          onClick={onSubmit}
          type="button"
          variant="primary"
        >
          {isSubmitting ? "Đang tải lên..." : "Lưu tư liệu"}
        </Button>
      </div>
    </form>
  );
}
