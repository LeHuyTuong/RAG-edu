import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, vi } from "vitest";

const documentsApi = vi.hoisted(() => ({
  createDocument: vi.fn(),
  createShareLink: vi.fn(),
  deleteDocument: vi.fn(),
  fetchDocumentDetail: vi.fn(),
  fetchDocuments: vi.fn(),
  fetchMyDocuments: vi.fn(),
  fetchSubjects: vi.fn(),
  hardDeleteDocument: vi.fn(),
  restoreDocument: vi.fn(),
  revokeShareLink: vi.fn(),
  updateDocument: vi.fn(),
}));

vi.mock("@/features/documents/api/documents.api", () => documentsApi);

import { documentKeys } from "@/features/documents/documents.keys";
import {
  useCreateDocument,
  useLibraryDocuments,
  useUpdateDocument,
} from "@/features/documents";

const pagination = { page: 1, limit: 12, total: 0, totalPages: 0 };
const updatedDocument = { id: "42", title: "Mới" };

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    queryClient,
    Wrapper({ children }: { readonly children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  documentsApi.fetchDocuments.mockResolvedValue({ documents: [], pagination });
  documentsApi.createDocument.mockResolvedValue(updatedDocument);
  documentsApi.updateDocument.mockResolvedValue(updatedDocument);
});

test("loads a normalized public document query through React Query", async () => {
  const { Wrapper } = createWrapper();
  const { result } = renderHook(
    () => useLibraryDocuments({ search: "  sử  " }),
    { wrapper: Wrapper },
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(documentsApi.fetchDocuments).toHaveBeenCalledWith({
    page: 1,
    limit: 12,
    search: "sử",
  });
});

test("invalidates document lists and the changed detail after an update", async () => {
  const { Wrapper, queryClient } = createWrapper();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useUpdateDocument(), {
    wrapper: Wrapper,
  });

  await act(async () => {
    await result.current.mutateAsync({
      id: "42",
      payload: { title: "Mới" },
    });
  });

  expect(invalidateSpy).toHaveBeenCalledWith({
    queryKey: documentKeys.lists(),
  });
  expect(invalidateSpy).toHaveBeenCalledWith({
    queryKey: documentKeys.detail("42"),
  });
});

test("invalidates library and owner lists after document creation", async () => {
  const { Wrapper, queryClient } = createWrapper();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useCreateDocument(), {
    wrapper: Wrapper,
  });

  await act(async () => {
    await result.current.mutateAsync({
      title: "Tư liệu",
      fileUrl: "http://localhost:8080/uploads/history.pdf",
      publicId: "history.pdf",
      sizeInBytes: 7,
      format: "pdf",
      resourceType: "local",
      isPublic: false,
    });
  });

  expect(invalidateSpy).toHaveBeenCalledWith({
    queryKey: documentKeys.lists(),
  });
  expect(invalidateSpy).toHaveBeenCalledWith({
    queryKey: [...documentKeys.all, "mine"],
  });
});
