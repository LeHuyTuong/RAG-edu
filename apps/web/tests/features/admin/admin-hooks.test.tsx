import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

const adminApi = vi.hoisted(() => ({
  getAccounts: vi.fn(),
  getBillingPlans: vi.fn(),
  getConfig: vi.fn(),
  getDashboard: vi.fn(),
  getSubjects: vi.fn(),
  toggleAccountBan: vi.fn(),
}));

vi.mock("@/features/admin/api/admin.api", () => ({ adminApi }));

import { adminQueryKeys } from "@/features/admin/admin.keys";
import {
  useAdminAccounts,
  useAdminBillingPlans,
  useAdminConfig,
  useAdminDashboard,
  useAdminSubjects,
  useToggleAdminAccountBan,
} from "@/features/admin";

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

beforeEach(() => {
  vi.clearAllMocks();
  adminApi.getDashboard.mockResolvedValue({ accounts: { total: 5 } });
  adminApi.getAccounts.mockResolvedValue([]);
  adminApi.getSubjects.mockResolvedValue({
    pagination: { limit: 20, page: 1, total: 0, totalPages: 0 },
    subjects: [],
  });
  adminApi.getBillingPlans.mockResolvedValue([]);
  adminApi.getConfig.mockResolvedValue({ maxSizeMb: 25 });
  adminApi.toggleAccountBan.mockResolvedValue({ id: "7" });
});

test("loads supported admin server state through feature query hooks", async () => {
  const { Wrapper } = createWrapper();
  const { result } = renderHook(
    () => ({
      accounts: useAdminAccounts(),
      billing: useAdminBillingPlans(),
      config: useAdminConfig(),
      dashboard: useAdminDashboard(),
      subjects: useAdminSubjects(),
    }),
    { wrapper: Wrapper },
  );

  await waitFor(() => expect(result.current.dashboard.isSuccess).toBe(true));

  expect(adminApi.getDashboard).toHaveBeenCalledOnce();
  expect(adminApi.getAccounts).toHaveBeenCalledWith({});
  expect(adminApi.getSubjects).toHaveBeenCalledWith({});
  expect(adminApi.getBillingPlans).toHaveBeenCalledOnce();
  expect(adminApi.getConfig).toHaveBeenCalledOnce();
});

test("invalidates the admin cache after toggling an account ban", async () => {
  const { Wrapper, queryClient } = createWrapper();
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useToggleAdminAccountBan(), {
    wrapper: Wrapper,
  });

  await act(async () => {
    await result.current.mutateAsync("7");
  });

  expect(adminApi.toggleAccountBan.mock.calls[0]?.[0]).toBe("7");
  expect(invalidateSpy).toHaveBeenCalledWith({
    queryKey: adminQueryKeys.accounts(),
  });
});
