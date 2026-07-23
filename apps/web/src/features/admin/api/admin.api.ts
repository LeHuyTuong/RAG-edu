import { apiClient } from "@/shared/api/api-client";
import { API_ENDPOINTS } from "@/shared/constants";

export type AdminAccountRole = "ADMIN" | "USER";
export type AdminAccountStatus = "ACTIVE" | "BANNED";

export interface AdminAccount {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly role: AdminAccountRole;
  readonly status: AdminAccountStatus;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface AdminDashboardStats {
  readonly accounts: {
    readonly total: number;
    readonly active: number;
    readonly banned: number;
    readonly unverified: number;
  };
  readonly subjects: { readonly total: number };
  readonly documents: {
    readonly total: number;
    readonly active: number;
    readonly pending: number;
    readonly rejected: number;
  };
  readonly billing: {
    readonly totalRevenue: number;
    readonly activeSubscriptions: number;
    readonly revenueChart: readonly {
      readonly name: string;
      readonly revenue: number;
    }[];
  };
}

export interface FetchAdminAccountsParams {
  readonly createdFrom?: string;
  readonly createdTo?: string;
  readonly role?: AdminAccountRole;
  readonly status?: AdminAccountStatus;
}

export interface CreateAdminAccountPayload {
  readonly email: string;
  readonly name: string;
  readonly password: string;
  readonly avatarUrl?: string;
  readonly role?: AdminAccountRole;
  readonly status?: AdminAccountStatus;
}

export interface UpdateAdminAccountPayload {
  readonly name?: string;
  readonly avatarUrl?: string;
}

export interface AdminSubject {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface FetchAdminSubjectsParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
}

export interface FetchAdminSubjectsResponse {
  readonly subjects: readonly AdminSubject[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

export interface CreateAdminSubjectPayload {
  readonly name: string;
  readonly code: string;
}

export interface UpdateAdminSubjectPayload {
  readonly name?: string;
  readonly code?: string;
}

export type AdminBillingCycle = "MONTHLY" | "YEARLY";

export interface AdminBillingPlan {
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly description?: string | null;
  readonly priceVnd: number;
  readonly billingCycle: AdminBillingCycle;
  readonly chatCreditsPerMonth: number;
  readonly documentQuota: number;
  readonly storageMb: number;
  readonly maxFileSizeMb: number;
  readonly displayOrder: number;
  readonly active: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface AdminBillingPlanPayload {
  readonly code: string;
  readonly name: string;
  readonly description?: string | null;
  readonly priceVnd: number;
  readonly billingCycle: AdminBillingCycle;
  readonly chatCreditsPerMonth: number;
  readonly documentQuota: number;
  readonly storageMb: number;
  readonly maxFileSizeMb: number;
  readonly displayOrder: number;
  readonly active: boolean;
}

export interface AdminConfig {
  readonly allowedTypes: string;
  readonly maxSizeMb: number;
  readonly autoApproveCron: string;
  readonly geminiApiKeys: string;
  readonly cerebrasApiKey: string;
  readonly activeLlmProvider: string;
}

type RawAdminConfig = Omit<AdminConfig, "maxSizeMb"> & {
  readonly maxSizeMb: string | number;
};

function mapAdminConfig(raw: RawAdminConfig): AdminConfig {
  const parsedMaxSize =
    typeof raw.maxSizeMb === "string"
      ? Number.parseInt(raw.maxSizeMb, 10)
      : raw.maxSizeMb;

  return {
    allowedTypes: raw.allowedTypes,
    maxSizeMb: Number.isFinite(parsedMaxSize) ? parsedMaxSize : 1,
    autoApproveCron: raw.autoApproveCron || "0 * * * * *",
    geminiApiKeys: raw.geminiApiKeys || "",
    cerebrasApiKey: raw.cerebrasApiKey || "",
    activeLlmProvider: raw.activeLlmProvider || "cerebras",
  };
}

export const adminApi = {
  async getDashboard(): Promise<AdminDashboardStats> {
    const result = await apiClient.get(API_ENDPOINTS.ADMIN.DASHBOARD);
    return result as unknown as AdminDashboardStats;
  },

  async getAccounts(
    params: FetchAdminAccountsParams = {},
  ): Promise<AdminAccount[]> {
    const result = await apiClient.get(API_ENDPOINTS.ACCOUNTS.BASE, { params });
    return result as unknown as AdminAccount[];
  },

  async getAccount(id: string): Promise<AdminAccount> {
    const result = await apiClient.get(API_ENDPOINTS.ACCOUNTS.DETAIL(id));
    return result as unknown as AdminAccount;
  },

  async createAccount(
    payload: CreateAdminAccountPayload,
  ): Promise<AdminAccount> {
    const result = await apiClient.post(API_ENDPOINTS.ACCOUNTS.BASE, payload);
    return result as unknown as AdminAccount;
  },

  async updateAccount(
    id: string,
    payload: UpdateAdminAccountPayload,
  ): Promise<AdminAccount> {
    const result = await apiClient.patch(
      API_ENDPOINTS.ACCOUNTS.DETAIL(id),
      payload,
    );
    return result as unknown as AdminAccount;
  },

  async toggleAccountBan(id: string): Promise<AdminAccount> {
    const result = await apiClient.patch(API_ENDPOINTS.ACCOUNTS.BAN(id));
    return result as unknown as AdminAccount;
  },

  async deleteAccount(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ACCOUNTS.DETAIL(id));
  },

  async getSubjects(
    params: FetchAdminSubjectsParams = {},
  ): Promise<FetchAdminSubjectsResponse> {
    const result = await apiClient.get(API_ENDPOINTS.SUBJECTS.BASE, { params });
    return result as unknown as FetchAdminSubjectsResponse;
  },

  async getSubject(id: string): Promise<AdminSubject> {
    const result = await apiClient.get(API_ENDPOINTS.SUBJECTS.DETAIL(id));
    return result as unknown as AdminSubject;
  },

  async createSubject(
    payload: CreateAdminSubjectPayload,
  ): Promise<AdminSubject> {
    const result = await apiClient.post(API_ENDPOINTS.SUBJECTS.BASE, payload);
    return result as unknown as AdminSubject;
  },

  async updateSubject(
    id: string,
    payload: UpdateAdminSubjectPayload,
  ): Promise<AdminSubject> {
    const result = await apiClient.patch(
      API_ENDPOINTS.SUBJECTS.DETAIL(id),
      payload,
    );
    return result as unknown as AdminSubject;
  },

  async deleteSubject(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.SUBJECTS.DETAIL(id));
  },

  async getBillingPlans(): Promise<AdminBillingPlan[]> {
    const result = await apiClient.get(API_ENDPOINTS.ADMIN.BILLING_PLANS);
    return result as unknown as AdminBillingPlan[];
  },

  async getBillingPlan(id: number): Promise<AdminBillingPlan> {
    const result = await apiClient.get(
      API_ENDPOINTS.ADMIN.BILLING_PLAN_DETAIL(id),
    );
    return result as unknown as AdminBillingPlan;
  },

  async createBillingPlan(
    payload: AdminBillingPlanPayload,
  ): Promise<AdminBillingPlan> {
    const result = await apiClient.post(
      API_ENDPOINTS.ADMIN.BILLING_PLANS,
      payload,
    );
    return result as unknown as AdminBillingPlan;
  },

  async updateBillingPlan(
    id: number,
    payload: AdminBillingPlanPayload,
  ): Promise<AdminBillingPlan> {
    const result = await apiClient.patch(
      API_ENDPOINTS.ADMIN.BILLING_PLAN_DETAIL(id),
      payload,
    );
    return result as unknown as AdminBillingPlan;
  },

  async deactivateBillingPlan(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ADMIN.BILLING_PLAN_DETAIL(id));
  },

  async getConfig(): Promise<AdminConfig> {
    const result = await apiClient.get(API_ENDPOINTS.ADMIN.CONFIG);
    return mapAdminConfig(result as unknown as RawAdminConfig);
  },

  async updateConfig(payload: Partial<AdminConfig>): Promise<AdminConfig> {
    const result = await apiClient.patch(API_ENDPOINTS.ADMIN.CONFIG, payload);
    return mapAdminConfig(result as unknown as RawAdminConfig);
  },
};
