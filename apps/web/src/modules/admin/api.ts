import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/shared/constants";

export type AdminAccountRole = "ADMIN" | "MODERATOR" | "USER";
export type AdminAccountStatus = "UNVERIFIED" | "ACTIVE" | "BANNED" | "DELETED";

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

export interface FetchAdminAccountsParams {
  readonly createdFrom?: string;
  readonly createdTo?: string;
}

export interface CreateAdminAccountPayload {
  readonly email: string;
  readonly name: string;
  readonly password: string;
  readonly avatarUrl?: string;
  readonly role?: AdminAccountRole;
  readonly status?: AdminAccountStatus;
}

export interface AdminDashboardStats {
  readonly accounts: {
    readonly total: number;
    readonly active: number;
    readonly banned: number;
    readonly unverified: number;
  };
  readonly subjects: {
    readonly total: number;
  };
  readonly documents: {
    readonly total: number;
    readonly active: number;
    readonly pending: number;
    readonly rejected: number;
  };
}

export const fetchAdminDashboardStats =
  async (): Promise<AdminDashboardStats> => {
    return apiClient.get<unknown, AdminDashboardStats>(
      API_ENDPOINTS.ADMIN.DASHBOARD,
    );
  };

export const fetchAdminAccounts = async (
  params: FetchAdminAccountsParams = {},
): Promise<AdminAccount[]> => {
  return apiClient.get<unknown, AdminAccount[]>(API_ENDPOINTS.ACCOUNTS.BASE, {
    params: {
      ...(params.createdFrom ? { createdFrom: params.createdFrom } : {}),
      ...(params.createdTo ? { createdTo: params.createdTo } : {}),
    },
  });
};

export const fetchAdminAccountDetail = async (
  id: string,
): Promise<AdminAccount> => {
  return apiClient.get<unknown, AdminAccount>(
    API_ENDPOINTS.ACCOUNTS.DETAIL(id),
  );
};

export const createAdminAccount = async (
  payload: CreateAdminAccountPayload,
): Promise<unknown> => {
  return apiClient.post(API_ENDPOINTS.ACCOUNTS.BASE, payload);
};

export const banAdminAccount = async (id: string): Promise<unknown> => {
  return apiClient.patch(API_ENDPOINTS.ACCOUNTS.BAN(id));
};

export interface AdminSubject {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly schoolId: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface FetchAdminSubjectsParams {
  readonly page?: number;
  readonly limit?: number;
  readonly schoolId?: string;
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
  readonly schoolId?: string;
}

export interface UpdateAdminSubjectPayload {
  readonly name?: string;
  readonly code?: string;
}

export const fetchAdminSubjects = async (
  params: FetchAdminSubjectsParams = {},
): Promise<FetchAdminSubjectsResponse> => {
  return apiClient.get<unknown, FetchAdminSubjectsResponse>(
    API_ENDPOINTS.SUBJECTS.BASE,
    {
      params: {
        page: params.page,
        limit: params.limit,
        schoolId: params.schoolId,
        search: params.search,
      },
    },
  );
};

export const fetchAdminSubjectDetail = async (
  id: string,
): Promise<AdminSubject> => {
  return apiClient.get<unknown, AdminSubject>(
    API_ENDPOINTS.SUBJECTS.DETAIL(id),
  );
};

export const createAdminSubject = async (
  payload: CreateAdminSubjectPayload,
): Promise<AdminSubject> => {
  return apiClient.post<unknown, AdminSubject>(
    API_ENDPOINTS.SUBJECTS.BASE,
    payload,
  );
};

export const updateAdminSubject = async (
  id: string,
  payload: UpdateAdminSubjectPayload,
): Promise<AdminSubject> => {
  return apiClient.patch<unknown, AdminSubject>(
    API_ENDPOINTS.SUBJECTS.DETAIL(id),
    payload,
  );
};

export const deleteAdminSubject = async (id: string): Promise<unknown> => {
  return apiClient.delete(API_ENDPOINTS.SUBJECTS.DETAIL(id));
};

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

export const fetchAdminBillingPlans = async (): Promise<AdminBillingPlan[]> => {
  return apiClient.get<unknown, AdminBillingPlan[]>(
    API_ENDPOINTS.ADMIN.BILLING_PLANS,
  );
};

export const fetchAdminBillingPlanDetail = async (
  id: number,
): Promise<AdminBillingPlan> => {
  return apiClient.get<unknown, AdminBillingPlan>(
    API_ENDPOINTS.ADMIN.BILLING_PLAN_DETAIL(id),
  );
};

export const createAdminBillingPlan = async (
  payload: AdminBillingPlanPayload,
): Promise<AdminBillingPlan> => {
  return apiClient.post<unknown, AdminBillingPlan>(
    API_ENDPOINTS.ADMIN.BILLING_PLANS,
    payload,
  );
};

export const updateAdminBillingPlan = async (
  id: number,
  payload: AdminBillingPlanPayload,
): Promise<AdminBillingPlan> => {
  return apiClient.patch<unknown, AdminBillingPlan>(
    API_ENDPOINTS.ADMIN.BILLING_PLAN_DETAIL(id),
    payload,
  );
};

export const deactivateAdminBillingPlan = async (
  id: number,
): Promise<unknown> => {
  return apiClient.delete(API_ENDPOINTS.ADMIN.BILLING_PLAN_DETAIL(id));
};

// ─── Admin Config ───
// Khớp SettingResponse/SettingUpdateRequest ở backend (feature/setting):
// backend chỉ quản lý 2 cấu hình upload, không có site/email/maintenance settings.

export interface AdminConfig {
  allowedTypes: string;
  maxSizeMb: number;
  autoApproveCron: string;
  geminiApiKeys: string;
  cerebrasApiKey: string;
  activeLlmProvider: string;
}

export async function fetchAdminConfig(): Promise<AdminConfig> {
  const result = await apiClient.get(API_ENDPOINTS.ADMIN.CONFIG);
  const raw = result as unknown as {
    allowedTypes: string;
    maxSizeMb: string | number;
    autoApproveCron: string;
    geminiApiKeys: string;
    cerebrasApiKey: string;
    activeLlmProvider: string;
  };
  return {
    allowedTypes: raw.allowedTypes,
    maxSizeMb:
      typeof raw.maxSizeMb === "string"
        ? parseInt(raw.maxSizeMb, 10)
        : raw.maxSizeMb,
    autoApproveCron: raw.autoApproveCron || "0 * * * * *",
    geminiApiKeys: raw.geminiApiKeys || "",
    cerebrasApiKey: raw.cerebrasApiKey || "",
    activeLlmProvider: raw.activeLlmProvider || "",
  };
}

export async function updateAdminConfig(
  payload: Partial<AdminConfig>,
): Promise<AdminConfig> {
  const result = await apiClient.patch(API_ENDPOINTS.ADMIN.CONFIG, payload);
  return result as unknown as AdminConfig;
}
