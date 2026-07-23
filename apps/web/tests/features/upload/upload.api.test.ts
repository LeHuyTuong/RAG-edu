import { describe, expect, test, vi } from "vitest";

const mockedApiClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/shared/api/api-client", () => ({ apiClient: mockedApiClient }));

import { fetchUploadConfig } from "@/features/upload/api/upload.api";

describe("fetchUploadConfig", () => {
  test("maps backend upload settings into UI validation config", async () => {
    mockedApiClient.get.mockResolvedValue({
      maxFileSize: 1048576,
      allowedTypes: "pdf, txt",
    });

    await expect(fetchUploadConfig()).resolves.toMatchObject({
      maxFileSize: 1048576,
      allowedExtensions: [".pdf", ".txt"],
      allowedMimeTypes: ["application/pdf", "text/plain"],
    });
  });
});
