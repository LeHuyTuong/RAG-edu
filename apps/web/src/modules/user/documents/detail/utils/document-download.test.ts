import { describe, expect, it } from "vitest";

import {
  buildCloudinaryDownloadUrl,
  buildDownloadFileName,
} from "./document-download";

describe("buildCloudinaryDownloadUrl", () => {
  it("adds Cloudinary's attachment flag to delivery URLs", () => {
    expect(
      buildCloudinaryDownloadUrl(
        "https://res.cloudinary.com/demo/raw/upload/v123/study/file.pdf",
      ),
    ).toBe(
      "https://res.cloudinary.com/demo/raw/upload/fl_attachment/v123/study/file.pdf",
    );
  });

  it("supports image and video delivery URLs", () => {
    expect(
      buildCloudinaryDownloadUrl(
        "https://res.cloudinary.com/demo/image/upload/v123/photo.png",
      ),
    ).toBe(
      "https://res.cloudinary.com/demo/image/upload/fl_attachment/v123/photo.png",
    );

    expect(
      buildCloudinaryDownloadUrl(
        "https://res.cloudinary.com/demo/video/upload/v123/lecture.mp4",
      ),
    ).toBe(
      "https://res.cloudinary.com/demo/video/upload/fl_attachment/v123/lecture.mp4",
    );
  });

  it("does not duplicate the attachment flag", () => {
    expect(
      buildCloudinaryDownloadUrl(
        "https://res.cloudinary.com/demo/raw/upload/fl_attachment/v123/file.pdf",
      ),
    ).toBe(
      "https://res.cloudinary.com/demo/raw/upload/fl_attachment/v123/file.pdf",
    );
  });

  it("leaves non-Cloudinary URLs unchanged", () => {
    expect(buildCloudinaryDownloadUrl("https://example.com/file.pdf")).toBe(
      "https://example.com/file.pdf",
    );
  });
});

describe("buildDownloadFileName", () => {
  it("builds a safe filename from title and format", () => {
    expect(buildDownloadFileName("Bài giảng: Cấu trúc dữ liệu", "PDF")).toBe(
      "Bai-giang-Cau-truc-du-lieu.pdf",
    );
  });

  it("does not append the same extension twice", () => {
    expect(buildDownloadFileName("lecture-notes.docx", "docx")).toBe(
      "lecture-notes.docx",
    );
  });

  it("falls back when title or format is missing", () => {
    expect(buildDownloadFileName("   ", "unknown")).toBe("document");
  });
});
