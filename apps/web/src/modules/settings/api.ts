import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/shared/constants";

export async function deleteAccount(userId: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.ACCOUNTS.DETAIL(userId));
}
