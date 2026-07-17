import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/shared/constants";

export interface BillingPlan {
  id: number;
  code: string;
  name: string;
  description: string;
  priceVnd: number;
  billingCycle: string;
  chatCreditsPerMonth: number;
  documentQuota: number;
  storageMb: number;
  maxFileSizeMb: number;
  active: boolean;
}

export interface Subscription {
  id: number;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: BillingPlan;
}

export interface UsageQuota {
  periodStart: string;
  periodEnd: string;
  chatLimit: number;
  chatUsed: number;
  chatRemaining: number;
  documentLimit: number;
  documentUsed: number;
  documentRemaining: number;
  storageMbLimit: number;
  storageMbUsed: number;
  storageMbRemaining: number;
}

export interface BillingSummary {
  currentSubscription: Subscription;
  usage: UsageQuota;
  availablePlans: BillingPlan[];
}

export const fetchBillingSummary = async (): Promise<BillingSummary> => {
  return (await apiClient.get(API_ENDPOINTS.BILLING.SUMMARY)) as BillingSummary;
};

export const demoPurchasePlan = async (
  planCode: string,
): Promise<BillingSummary> => {
  return (await apiClient.post(API_ENDPOINTS.BILLING.DEMO_PURCHASE, {
    planCode,
  })) as BillingSummary;
};
