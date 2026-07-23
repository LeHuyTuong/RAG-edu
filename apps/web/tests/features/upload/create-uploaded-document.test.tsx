import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const uploadApi = vi.hoisted(() => ({ uploadFile: vi.fn() }));
const documentHooks = vi.hoisted(() => ({ useCreateDocument: vi.fn() }));

vi.mock("@/features/upload/api/upload.api", () => uploadApi);
vi.mock("@/features/documents", () => documentHooks);

import { useCreateUploadedDocument } from "@/features/upload/hooks/use-create-uploaded-document";

const file = new File(["archive"], "history.pdf", {
  type: "application/pdf",
});
const uploadedFile = {
  fileUrl: "http://localhost:8080/uploads/history.pdf",
  publicId: "history.pdf",
  sizeInBytes: 7,
  format: "pdf",
  resourceType: "local",
};

function Wrapper({ children }: { readonly children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  uploadApi.uploadFile.mockResolvedValue(uploadedFile);
  documentHooks.useCreateDocument.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ id: "12" }),
  });
});

test("uploads the file before registering its document record", async () => {
  const { result } = renderHook(() => useCreateUploadedDocument(), {
    wrapper: Wrapper,
  });

  await result.current.mutateAsync({
    file,
    title: "Tư liệu",
    isPublic: false,
  });

  expect(uploadApi.uploadFile).toHaveBeenCalledWith(file);
  expect(documentHooks.useCreateDocument().mutateAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      fileUrl: uploadedFile.fileUrl,
      title: "Tư liệu",
    }),
  );
});
