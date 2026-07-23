import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";

const documentsApi = vi.hoisted(() => ({
  approveDocument: vi.fn(),
}));

vi.mock("@/features/documents/api/documents.api", () => documentsApi);

import { documentKeys } from "@/features/documents";
import { useApproveDocument } from "@/features/documents";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    queryClient,
    Wrapper({ children }: { readonly children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    },
  };
}

test("invalidates document views after an admin approves a document", async () => {
  documentsApi.approveDocument.mockResolvedValue({ id: "9" });
  const { Wrapper, queryClient } = createWrapper();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useApproveDocument(), {
    wrapper: Wrapper,
  });

  await act(async () => {
    await result.current.mutateAsync("9");
  });

  expect(documentsApi.approveDocument.mock.calls[0]?.[0]).toBe("9");
  expect(invalidateSpy).toHaveBeenCalledWith({
    queryKey: documentKeys.lists(),
  });
  expect(invalidateSpy).toHaveBeenCalledWith({
    queryKey: documentKeys.detail("9"),
  });
});
