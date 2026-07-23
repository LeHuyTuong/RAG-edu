import { expect, test } from "vitest";

import { DEFAULT_UPLOAD_CONFIG } from "@/constants/upload.const";
import { validateFile } from "@/utils/validate.file";

test("uses the configured extension list when validating a file", () => {
  const file = new File(["image"], "map.png", { type: "image/png" });

  expect(
    validateFile(file, {
      ...DEFAULT_UPLOAD_CONFIG,
      allowedExtensions: [".png"],
    }),
  ).toEqual({ valid: true });
});
