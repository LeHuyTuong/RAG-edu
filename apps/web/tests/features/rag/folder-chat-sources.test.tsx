import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const documentHooks = vi.hoisted(() => ({
  useFolderOptions: vi.fn(),
  useLibraryDocuments: vi.fn(),
}));

vi.mock("@/features/documents", () => documentHooks);

import { useFolderChatSources } from "@/features/rag/hooks/use-folder-chat-sources";

const readyDocument = {
  id: "8",
  ragStatus: "READY",
  chunkCount: 2,
};
const pendingDocument = {
  id: "9",
  ragStatus: "PENDING_REVIEW",
  chunkCount: 0,
};

beforeEach(() => {
  documentHooks.useLibraryDocuments.mockReturnValue({
    data: { documents: [readyDocument, pendingDocument] },
    isError: false,
    isLoading: false,
  });
  documentHooks.useFolderOptions.mockReturnValue({
    data: [{ id: 12, folderName: "Thư mục sử học" }],
  });
});

test("defaults a folder to READY document source IDs", async () => {
  const { result } = renderHook(() => useFolderChatSources(12));

  await waitFor(() => expect(result.current.readySourceIds).toEqual([8]));

  expect(result.current.folderName).toBe("Thư mục sử học");
  expect(documentHooks.useLibraryDocuments).toHaveBeenCalledWith(
    { folderId: 12, onlyMine: true, limit: 50, page: 1 },
    { enabled: true },
  );
});
