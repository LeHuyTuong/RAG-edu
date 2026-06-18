import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  approveDocument,
  createDocument,
  deleteDocument,
  fetchDocumentDetail,
  fetchDocuments,
  fetchMyDocuments,
  rejectDocument,
  updateDocument,
} from "../src/apis/document.api";
import { apiClient } from "../src/lib/axios";

vi.mock("../src/lib/axios", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const clientMock = vi.mocked(apiClient);

describe("document api helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches public documents with supported query params", async () => {
    const response = { documents: [], pagination: { page: 1 } };
    clientMock.get.mockResolvedValue(response);

    await expect(
      fetchDocuments({
        page: 2,
        limit: 20,
        subjectId: "subject-1",
        authorId: "author-1",
        status: "PENDING",
      }),
    ).resolves.toBe(response);

    expect(clientMock.get).toHaveBeenCalledWith("/api/v1/documents", {
      params: {
        page: 2,
        limit: 20,
        subjectId: "subject-1",
        authorId: "author-1",
        status: "PENDING",
      },
    });
  });

  it("fetches document detail by id", async () => {
    const response = { id: "doc-1" };
    clientMock.get.mockResolvedValue(response);

    await expect(fetchDocumentDetail("doc-1")).resolves.toBe(response);

    expect(clientMock.get).toHaveBeenCalledWith("/api/v1/documents/doc-1");
  });

  it("fetches current user documents with filters", async () => {
    const response = { documents: [], pagination: { page: 1 } };
    clientMock.get.mockResolvedValue(response);

    await expect(
      fetchMyDocuments({ page: 3, limit: 4, subjectId: "subject-1" }),
    ).resolves.toBe(response);

    expect(clientMock.get).toHaveBeenCalledWith("/api/v1/documents/me", {
      params: {
        page: 3,
        limit: 4,
        subjectId: "subject-1",
      },
    });
  });

  it("creates document metadata", async () => {
    const payload = {
      title: "Doc",
      fileUrl: "https://example.com/doc.pdf",
      publicId: "doc",
      sizeInBytes: 120,
      format: "pdf",
      resourceType: "raw",
      isPublic: true,
    };
    const response = { id: "doc-1" };
    clientMock.post.mockResolvedValue(response);

    await expect(createDocument(payload)).resolves.toBe(response);

    expect(clientMock.post).toHaveBeenCalledWith("/api/v1/documents", payload);
  });

  it("updates document metadata", async () => {
    const payload = { title: "Updated", isPublic: true };
    const response = { id: "doc-1", title: "Updated" };
    clientMock.patch.mockResolvedValue(response);

    await expect(updateDocument("doc-1", payload)).resolves.toBe(response);

    expect(clientMock.patch).toHaveBeenCalledWith(
      "/api/v1/documents/doc-1",
      payload,
    );
  });

  it("approves pending document metadata", async () => {
    const response = { id: "doc-1", status: "ACTIVE" };
    clientMock.post.mockResolvedValue(response);

    await expect(approveDocument("doc-1")).resolves.toBe(response);

    expect(clientMock.post).toHaveBeenCalledWith(
      "/api/v1/documents/doc-1/approve",
    );
  });

  it("rejects pending document metadata with a reason", async () => {
    const payload = { rejectionReason: "Thiếu mô tả rõ ràng." };
    const response = { id: "doc-1", status: "REJECTED" };
    clientMock.post.mockResolvedValue(response);

    await expect(rejectDocument("doc-1", payload)).resolves.toBe(response);

    expect(clientMock.post).toHaveBeenCalledWith(
      "/api/v1/documents/doc-1/reject",
      payload,
    );
  });

  it("deletes document metadata", async () => {
    clientMock.delete.mockResolvedValue(undefined);

    await expect(deleteDocument("doc-1")).resolves.toBeUndefined();

    expect(clientMock.delete).toHaveBeenCalledWith("/api/v1/documents/doc-1");
  });
});
