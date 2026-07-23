import { render, screen } from "@testing-library/react";
import { beforeAll, vi } from "vitest";

const documentHooks = vi.hoisted(() => ({
  useLibraryDocuments: vi.fn(),
  useSubjects: vi.fn(),
}));

vi.mock("@/features/documents/hooks/use-library-documents", () => ({
  useLibraryDocuments: documentHooks.useLibraryDocuments,
}));
vi.mock("@/features/documents/hooks/use-subjects", () => ({
  useSubjects: documentHooks.useSubjects,
}));

import LibraryPage from "@/features/documents/pages/LibraryPage";

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      disconnect() {}
      observe() {}
    },
  );
});

test("renders query-backed library documents without a page fetch effect", () => {
  documentHooks.useLibraryDocuments.mockReturnValue({
    data: {
      documents: [
        {
          id: "42",
          title: "Lịch sử Việt Nam",
          publicId: "history/pdf",
          fileUrl: "https://example.com/history.pdf",
          format: "pdf",
          sizeInBytes: 1024,
          status: "ACTIVE",
          isPublic: true,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
          author: { id: "1", name: "Nguyễn An", avatarUrl: null },
          subject: null,
        },
      ],
      pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
    },
    error: null,
    isLoading: false,
  });
  documentHooks.useSubjects.mockReturnValue({
    data: {
      subjects: [],
      pagination: { page: 1, limit: 100, total: 0, totalPages: 0 },
    },
    isLoading: false,
  });

  render(<LibraryPage />);

  expect(screen.getByText("Lịch sử Việt Nam")).toBeInTheDocument();
  expect(documentHooks.useLibraryDocuments).toHaveBeenCalled();
  expect(documentHooks.useSubjects).toHaveBeenCalled();
});
