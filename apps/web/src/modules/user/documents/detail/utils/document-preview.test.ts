import { describe, expect, it } from "vitest";
import { buildPreviewSkeleton } from "./document-preview";

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
});
