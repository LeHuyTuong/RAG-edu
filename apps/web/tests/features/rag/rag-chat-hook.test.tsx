import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";

const ragApi = vi.hoisted(() => ({ ragChat: vi.fn() }));

vi.mock("@/features/rag/api/rag.api", () => ragApi);

import { useRagChat } from "@/features/rag";

function Wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            mutations: { retry: false },
            queries: { retry: false },
          },
        })
      }
    >
      {children}
    </QueryClientProvider>
  );
}

test("sends a non-streaming RAG request through a feature mutation", async () => {
  ragApi.ragChat.mockResolvedValue({ answer: "Trả lời", citations: [] });
  const { result } = renderHook(() => useRagChat(), { wrapper: Wrapper });

  await act(async () => {
    await result.current.mutateAsync({ question: "Tài liệu này nói gì?" });
  });

  expect(ragApi.ragChat.mock.calls[0]?.[0]).toEqual({
    question: "Tài liệu này nói gì?",
  });
  await waitFor(() =>
    expect(result.current.data).toMatchObject({ answer: "Trả lời" }),
  );
});
