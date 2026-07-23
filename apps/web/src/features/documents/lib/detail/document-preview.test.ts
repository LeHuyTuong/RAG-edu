import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentDetail } from "@/types/document.type";
import { buildPreviewSkeleton, loadDocumentPreview } from "./document-preview";

const pdfDocument = {
  id: "101",
  title: "Reject PDF",
  description: null,
  fileUrl: "https://res.cloudinary.com/demo/reject.pdf",
  publicId: "reject.pdf",
  format: "pdf",
  sizeInBytes: 1024,
  createdAt: "2026-07-02T00:00:00.000Z",
  author: {
    id: "1",
    name: "Test Student",
    email: "student@example.com",
    avatarUrl: null,
  },
  subject: null,
} satisfies DocumentDetail;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("buildPreviewSkeleton", () => {
  it("maps pdf to the pdf preview branch", () => {
    expect(buildPreviewSkeleton("PDF", "https://example.com/file.pdf")).toEqual(
      {
        type: "pdf",
        fileUrl: "https://example.com/file.pdf",
      },
    );
  });

  it("maps docx and doc to the docx preview branch", () => {
    expect(
      buildPreviewSkeleton("docx", "https://example.com/file.docx"),
    ).toEqual({ type: "docx" });
    expect(buildPreviewSkeleton("doc", "https://example.com/file.doc")).toEqual(
      { type: "docx" },
    );
  });

  it("maps text and image formats to their preview branches", () => {
    expect(buildPreviewSkeleton("txt", "https://example.com/file.txt")).toEqual(
      { type: "txt" },
    );
    expect(buildPreviewSkeleton("png", "https://example.com/file.png")).toEqual(
      { type: "image", images: ["https://example.com/file.png"] },
    );
  });

  it("falls back to the unsupported branch for pptx", () => {
    expect(
      buildPreviewSkeleton("pptx", "https://example.com/file.pptx"),
    ).toEqual({ type: "unsupported" });
  });

  it("builds PDF preview from a fetched file", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    const createObjectURL = vi.fn().mockReturnValue("blob:preview");
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL: vi.fn(),
    });

    await expect(loadDocumentPreview(pdfDocument, blob)).resolves.toEqual({
      type: "pdf",
      fileUrl: "blob:preview",
      objectUrl: "blob:preview",
    });
    expect(createObjectURL).toHaveBeenCalledWith(blob);
  });
});
