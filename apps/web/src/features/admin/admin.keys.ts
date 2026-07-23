import type {
  FetchAdminAccountsParams,
  FetchAdminSubjectsParams,
} from "./api/admin.api";

export const adminQueryKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminQueryKeys.all, "dashboard"] as const,
  accounts: (params: FetchAdminAccountsParams = {}) =>
    [...adminQueryKeys.all, "accounts", params] as const,
  account: (id: string) => [...adminQueryKeys.all, "account", id] as const,
  subjects: (params: FetchAdminSubjectsParams = {}) =>
    [...adminQueryKeys.all, "subjects", params] as const,
  subject: (id: string) => [...adminQueryKeys.all, "subject", id] as const,
  billingPlans: () => [...adminQueryKeys.all, "billing-plans"] as const,
  billingPlan: (id: number) =>
    [...adminQueryKeys.all, "billing-plan", id] as const,
  config: () => [...adminQueryKeys.all, "config"] as const,
};
