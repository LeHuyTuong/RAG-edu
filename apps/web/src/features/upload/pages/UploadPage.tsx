"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { DEFAULT_UPLOAD_CONFIG } from "@/constants/upload.const";
import { useFolderOptions, useSubjects } from "@/features/documents";
import { useUploadConfig } from "@/features/upload";

import FileUploadBox from "../components/FileUploadBox";
import { DocumentUploadForm } from "../components/DocumentUploadForm";
import { useUploadForm } from "../hooks/use-upload-form";

/**
 * FLOW DOC: apps/web/docs/FRONTEND-CODE-FLOW-VI.md#flow-upload
 * Page ghép config/subjects/folders server state với file state và upload form;
 * request thật nằm trong useCreateUploadedDocument/API layer.
 */

export default function UploadPage(): React.JSX.Element {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const configQuery = useUploadConfig();
  const subjectsQuery = useSubjects(100);
  const foldersQuery = useFolderOptions();
  const form = useUploadForm({
    selectedFile,
    onSuccess: () => {
      setSelectedFile(null);
      setIsSuccess(true);
    },
  });

  if (isSuccess) {
    return (
      <div className="min-w-0 flex flex-col items-center justify-center py-24 text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-primary">
          task_alt
        </span>
        <h2 className="text-2xl font-bold text-on-surface">
          Tải lên thành công!
        </h2>
        <p className="text-on-surface-variant">
          Tài liệu đang chờ kiểm duyệt (nếu công khai) hoặc đã được lưu riêng
          tư.
        </p>
        <Button
          onClick={() => setIsSuccess(false)}
          type="button"
          variant="primary"
        >
          Tải lên tài liệu khác
        </Button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">
          Tải lên tài liệu mới
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Chia sẻ kiến thức của bạn với cộng đồng học thuật AcademiShare.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <FileUploadBox
          config={configQuery.data ?? DEFAULT_UPLOAD_CONFIG}
          isSubmitting={form.isSubmitting}
          onFileChange={setSelectedFile}
          selectedFile={selectedFile}
        />

        <DocumentUploadForm
          folders={foldersQuery.data ?? []}
          hasSelectedFile={Boolean(selectedFile)}
          isLoadingSubjects={subjectsQuery.isLoading}
          isSubmitting={form.isSubmitting}
          onSubmit={form.submit}
          setField={form.setField}
          submitError={form.submitError}
          subjects={subjectsQuery.data?.subjects ?? []}
          values={form.values}
        />
      </div>
    </div>
  );
}
