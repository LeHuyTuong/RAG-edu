import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const hooks = vi.hoisted(() => ({
  useDeleteDocument: vi.fn(),
  useHardDeleteDocument: vi.fn(),
  useMyDocuments: vi.fn(),
  useRestoreDocument: vi.fn(),
  useSubjects: vi.fn(),
  useUpdateDocument: vi.fn(),
}));

vi.mock("@/features/documents", () => hooks);
vi.mock(
  "@/features/documents/components/my-documents/DocumentDetailModal",
  () => ({
    DocumentDetailModal: () => <div>Document modal</div>,
  }),
);
vi.mock("@/features/documents/components/my-documents/DocumentStats", () => ({
  DocumentStats: () => <div>Document stats</div>,
}));
vi.mock("@/features/documents/components/my-documents/DocumentTable", () => ({
  DocumentTable: () => <div>Document table</div>,
}));

import MyDocumentsPage from "@/features/documents/pages/MyDocumentsPage";

beforeEach(() => {
  hooks.useMyDocuments.mockReturnValue({
    data: {
      documents: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    },
    isError: false,
    isLoading: false,
  });
  hooks.useSubjects.mockReturnValue({ data: { subjects: [] } });
  for (const mutation of [
    hooks.useDeleteDocument,
    hooks.useHardDeleteDocument,
    hooks.useRestoreDocument,
    hooks.useUpdateDocument,
  ]) {
    mutation.mockReturnValue({ isPending: false, mutateAsync: vi.fn() });
  }
});

test("loads the current user's documents through the feature query", () => {
  render(<MyDocumentsPage />);

  expect(
    screen.getByRole("heading", { name: "Tài liệu của tôi" }),
  ).toBeInTheDocument();
  expect(hooks.useMyDocuments).toHaveBeenCalledWith({ page: 1, limit: 10 });
});
