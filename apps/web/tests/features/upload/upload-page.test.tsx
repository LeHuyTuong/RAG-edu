import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const uploadHooks = vi.hoisted(() => ({
  useUploadConfig: vi.fn(),
  useUploadForm: vi.fn(),
}));
const documentHooks = vi.hoisted(() => ({
  useFolderOptions: vi.fn(),
  useSubjects: vi.fn(),
}));

vi.mock("@/features/upload", () => ({
  useUploadConfig: uploadHooks.useUploadConfig,
}));
vi.mock("@/features/upload/hooks/use-upload-form", () => ({
  useUploadForm: uploadHooks.useUploadForm,
}));
vi.mock("@/features/documents", () => documentHooks);
vi.mock("@/features/upload/components/FileUploadBox", () => ({
  default: () => <div>File box</div>,
}));
vi.mock("@/features/upload/components/DocumentUploadForm", () => ({
  DocumentUploadForm: () => <div>Document form</div>,
}));

import UploadPage from "@/features/upload/pages/UploadPage";
import { DEFAULT_UPLOAD_CONFIG } from "@/constants/upload.const";

beforeEach(() => {
  uploadHooks.useUploadConfig.mockReturnValue({
    data: DEFAULT_UPLOAD_CONFIG,
  });
  uploadHooks.useUploadForm.mockReturnValue({
    values: {},
    setField: vi.fn(),
    isSubmitting: false,
    submitError: null,
    submit: vi.fn(),
  });
  documentHooks.useSubjects.mockReturnValue({
    data: { subjects: [] },
    isLoading: false,
  });
  documentHooks.useFolderOptions.mockReturnValue({ data: [] });
});

test("wires query-backed config and options into upload UI", () => {
  render(<UploadPage />);

  expect(
    screen.getByRole("heading", { name: "Tải lên tài liệu mới" }),
  ).toBeInTheDocument();
  expect(uploadHooks.useUploadConfig).toHaveBeenCalledOnce();
  expect(documentHooks.useSubjects).toHaveBeenCalledWith(100);
  expect(documentHooks.useFolderOptions).toHaveBeenCalledOnce();
});
