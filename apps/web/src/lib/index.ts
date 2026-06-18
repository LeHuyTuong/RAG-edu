/**
 * Library Functions & Helpers
 */

import { APP_CONFIG } from "@/config";

// Axios API Client (với Refresh Token interceptor)
export { apiClient } from "./axios";

// API Client (legacy fetch wrapper)
export const fetchAPI = async <T = unknown>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> => {
  const baseUrl = APP_CONFIG.api.baseUrl;
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API fetch error:", error);
    throw error;
  }
};

// Class Name Merger (cn alternative)
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(" ");
};
