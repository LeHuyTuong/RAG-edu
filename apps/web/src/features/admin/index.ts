/**
 * FLOW DOC: apps/web/docs/FRONTEND-CODE-FLOW-VI.md#flow-admin
 * Public API của admin feature: admin API, query keys và các domain hooks.
 */

export * from "./api/admin.api";
export { adminQueryKeys } from "./admin.keys";
export {
  useAdminAccount,
  useAdminAccounts,
  useCreateAdminAccount,
  useDeleteAdminAccount,
  useToggleAdminAccountBan,
  useUpdateAdminAccount,
} from "./hooks/use-admin-accounts";
export {
  useAdminBillingPlan,
  useAdminBillingPlans,
  useCreateAdminBillingPlan,
  useDeactivateAdminBillingPlan,
  useUpdateAdminBillingPlan,
} from "./hooks/use-admin-billing-plans";
export { useAdminConfig, useUpdateAdminConfig } from "./hooks/use-admin-config";
export { useAdminDashboard } from "./hooks/use-admin-dashboard";
export {
  useAdminSubject,
  useAdminSubjects,
  useCreateAdminSubject,
  useDeleteAdminSubject,
  useUpdateAdminSubject,
} from "./hooks/use-admin-subjects";
