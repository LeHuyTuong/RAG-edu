import { beforeEach, describe, expect, test, vi } from "vitest";

const mockedApiClient = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/shared/api/api-client", () => ({ apiClient: mockedApiClient }));

import { adminApi } from "@/features/admin/api/admin.api";
import { API_ENDPOINTS } from "@/shared/constants";

describe("adminApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("loads dashboard statistics through the shared client", async () => {
    const dashboard = { accounts: { total: 12 } };
    mockedApiClient.get.mockResolvedValue(dashboard);

    await expect(adminApi.getDashboard()).resolves.toEqual(dashboard);
    expect(mockedApiClient.get).toHaveBeenCalledWith(
      API_ENDPOINTS.ADMIN.DASHBOARD,
    );
  });

  test("normalizes the numeric upload-size setting returned by the backend", async () => {
    mockedApiClient.get.mockResolvedValue({
      activeLlmProvider: "cerebras",
      allowedTypes: "pdf,docx",
      autoApproveCron: "0 * * * * *",
      cerebrasApiKey: "",
      geminiApiKeys: "",
      maxSizeMb: "25",
    });

    await expect(adminApi.getConfig()).resolves.toMatchObject({
      maxSizeMb: 25,
    });
    expect(mockedApiClient.get).toHaveBeenCalledWith(
      API_ENDPOINTS.ADMIN.CONFIG,
    );
  });

  test("sends account, subject and billing mutations to supported endpoints", async () => {
    mockedApiClient.patch.mockResolvedValue(undefined);
    mockedApiClient.post.mockResolvedValue({ id: "11" });
    mockedApiClient.delete.mockResolvedValue(undefined);

    await adminApi.toggleAccountBan("7");
    await adminApi.createSubject({ code: "VN-01", name: "Việt Nam" });
    await adminApi.deactivateBillingPlan(11);

    expect(mockedApiClient.patch).toHaveBeenCalledWith(
      API_ENDPOINTS.ACCOUNTS.BAN("7"),
    );
    expect(mockedApiClient.post).toHaveBeenCalledWith(
      API_ENDPOINTS.SUBJECTS.BASE,
      { code: "VN-01", name: "Việt Nam" },
    );
    expect(mockedApiClient.delete).toHaveBeenCalledWith(
      API_ENDPOINTS.ADMIN.BILLING_PLAN_DETAIL(11),
    );
  });
});
