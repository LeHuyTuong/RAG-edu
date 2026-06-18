import { describe, expect, it } from "vitest";
import { buildCloudinaryUploadResult } from "./cloudinary-upload-result";

describe("buildCloudinaryUploadResult", () => {
  it("derives docx format from the selected filename when Cloudinary omits format", () => {
    const file = new File(["content"], "lecture-notes.DOCX", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const result = buildCloudinaryUploadResult(
      {
        secure_url:
          "https://res.cloudinary.com/demo/raw/upload/v1/study/lecture-notes",
        public_id: "study/lecture-notes",
        bytes: 42,
        resource_type: "raw",
      },
      file,
    );

    expect(result).toEqual({
      url: "https://res.cloudinary.com/demo/raw/upload/v1/study/lecture-notes",
      publicId: "study/lecture-notes",
      bytes: 42,
      format: "docx",
      resourceType: "raw",
    });
  });
});
