import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const ragApi = vi.hoisted(() => ({ chatStream: vi.fn() }));
const auth = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock("@/features/rag/api/rag.api", () => ragApi);
vi.mock("@/features/auth", () => auth);

import { useRagChatStream } from "@/features/rag/hooks/use-rag-chat-stream";

beforeEach(() => {
  auth.useAuth.mockReturnValue({ accessToken: "access-token" });
  ragApi.chatStream.mockImplementation(async (_request, _token, callbacks) => {
    callbacks.onChunk("Trả lời");
    callbacks.onCitations?.([{ id: 3, title: "Nguồn" }]);
    callbacks.onComplete("Trả lời");
    return new AbortController();
  });
});

test("adds stream chunks and citations to its assistant message", async () => {
  const { result } = renderHook(() => useRagChatStream());

  act(() => result.current.setInput("Câu hỏi"));
  await act(async () => {
    await result.current.send({ folderId: 12, sourceIds: [3] });
  });

  expect(result.current.messages.at(-1)).toMatchObject({
    role: "assistant",
    content: "Trả lời",
    citations: [{ id: 3, title: "Nguồn" }],
  });
});
