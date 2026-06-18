import { apiClient } from "@/lib/axios";

export async function deleteAccount(userId: string): Promise<void> {
  await apiClient.delete(`/api/v1/accounts/${userId}`);
}
