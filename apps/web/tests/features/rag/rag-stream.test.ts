import { waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const mockedApiClient = vi.hoisted(() => ({
  defaults: { baseURL: "http://api.example.test" },
}));

vi.mock("@/shared/api/api-client", () => ({ apiClient: mockedApiClient }));

import { chatStream } from "@/features/rag/api/rag.api";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("emits stream tokens and mapped citations before completing", async () => {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          'data: {"token":"Xin chào ","citations":[{"sourceId":7,"score":0.9}]}\n\n',
        ),
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({ ok: true, body, status: 200, statusText: "OK" }),
  );
  const onChunk = vi.fn();
  const onCitations = vi.fn();
  const onComplete = vi.fn();

  await chatStream({ question: "?" }, "token", {
    onChunk,
    onCitations,
    onComplete,
    onError: vi.fn(),
  });

  await waitFor(() => expect(onComplete).toHaveBeenCalledWith("Xin chào "));

  expect(onChunk).toHaveBeenCalledWith("Xin chào ");
  expect(onCitations).toHaveBeenCalledWith([
    expect.objectContaining({ id: 7, relevance: 0.9 }),
  ]);
});
