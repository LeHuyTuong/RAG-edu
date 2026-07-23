import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const hooks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useDocumentDetail: vi.fn(),
  useDocumentPreview: vi.fn(),
  useLibraryDocuments: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useParams: () => ({ id: "42" }) }));
vi.mock("@/features/auth", () => ({ useAuth: hooks.useAuth }));
vi.mock("@/features/documents/hooks/use-document-detail", () => ({
  useDocumentDetail: hooks.useDocumentDetail,
}));
vi.mock("@/features/documents/hooks/use-document-preview", () => ({
  useDocumentPreview: hooks.useDocumentPreview,
}));
vi.mock("@/features/documents/hooks/use-library-documents", () => ({
  useLibraryDocuments: hooks.useLibraryDocuments,
}));
vi.mock("@/features/documents/components/detail/DocumentHero", () => ({
  DocumentHero: ({ document }: { document: { title: string } }) => (
    <h1>{document.title}</h1>
  ),
}));
vi.mock("@/features/documents/components/detail/DocumentPreview", () => ({
  DocumentPreview: () => <div>Preview</div>,
}));
vi.mock("@/features/documents/components/detail/FileInfoCard", () => ({
  FileInfoCard: () => <div>File info</div>,
}));
vi.mock("@/features/documents/components/detail/RelatedDocumentCard", () => ({
  RelatedDocumentCard: () => <div>Related document</div>,
}));
vi.mock("@/features/documents/components/detail/AuthorCard", () => ({
  AuthorCard: () => <div>Author</div>,
}));
vi.mock("@/features/documents/components/detail/ShareCard", () => ({
  ShareCard: () => <div>Share</div>,
}));

import DocumentDetailPage from "@/features/documents/pages/DocumentDetailPage";

const documentDetail = {
  id: "42",
  title: "Lịch sử Việt Nam",
  description: "Tư liệu học tập",
  fileUrl: "https://example.com/history.pdf",
  publicId: "history/pdf",
  format: "pdf",
  sizeInBytes: 1024,
  createdAt: "2026-07-01T00:00:00.000Z",
  author: {
    id: "1",
    name: "Nguyễn An",
    email: "student@example.com",
    avatarUrl: null,
  },
  subject: null,
};

beforeEach(() => {
  hooks.useAuth.mockReturnValue({
    accessToken: "access-token",
    user: { id: "1" },
  });
  hooks.useDocumentDetail.mockReturnValue({
    data: documentDetail,
    error: null,
    isError: false,
    isLoading: false,
  });
  hooks.useDocumentPreview.mockReturnValue({
    preview: { type: "error" },
    isLoadingPreview: false,
  });
  hooks.useLibraryDocuments.mockReturnValue({ data: undefined });
});

test("loads metadata through the detail query and hides unsupported controls", () => {
  render(<DocumentDetailPage />);

  expect(screen.getByText("Lịch sử Việt Nam")).toBeInTheDocument();
  expect(hooks.useDocumentDetail).toHaveBeenCalledWith("42");
  expect(screen.queryByText("Thảo luận")).not.toBeInTheDocument();
  expect(
    screen.queryByText("Xem thêm tài liệu tương tự"),
  ).not.toBeInTheDocument();
});
