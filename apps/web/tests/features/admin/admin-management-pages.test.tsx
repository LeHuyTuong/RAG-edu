import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { test, vi } from "vitest";

const useAdminAccounts = vi.hoisted(() => vi.fn());
const useCreateAdminAccount = vi.hoisted(() => vi.fn());
const useToggleAdminAccountBan = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/admin", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/admin")>()),
  useAdminAccounts,
  useCreateAdminAccount,
  useToggleAdminAccountBan,
}));

import AdminUserManagementPage from "@/features/admin/pages/AdminUserManagementPage";

function Wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      {children}
    </QueryClientProvider>
  );
}

test("does not render the unsupported moderator account role", () => {
  useAdminAccounts.mockReturnValue({ data: [], error: null, isLoading: false });
  useCreateAdminAccount.mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn(),
  });
  useToggleAdminAccountBan.mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn(),
  });

  render(<AdminUserManagementPage />, { wrapper: Wrapper });

  expect(screen.queryByText("Kiểm duyệt viên")).not.toBeInTheDocument();
  expect(screen.getByText("Quản lý người dùng")).toBeInTheDocument();
});
