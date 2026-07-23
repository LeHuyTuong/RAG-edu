import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const hooks = vi.hoisted(() => ({
  useDocumentFileActions: vi.fn(),
}));

vi.mock("@/features/documents/hooks/use-document-file-actions", () => ({
  useDocumentFileActions: hooks.useDocumentFileActions,
}));

import { DocumentHero } from "@/features/documents/components/detail/DocumentHero";

const documentDetail = {
  id: "42",
  title: "Lịch sử Việt Nam",
  description: null,
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
  hooks.useDocumentFileActions.mockReturnValue({
    download: vi.fn(),
    open: vi.fn(),
    isDownloading: false,
  });
});

test("keeps only backend-supported file actions", () => {
  render(<DocumentHero document={documentDetail} />);

  expect(
    screen.getByRole("button", { name: /mở tài liệu/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /tải xuống/i }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /lưu lại/i }),
  ).not.toBeInTheDocument();
});
