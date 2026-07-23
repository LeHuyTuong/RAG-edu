/**
 * API Endpoints Constants
 * Tập trung tất cả các URL endpoint dùng trong toàn bộ ứng dụng
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/auth/signin",
    REGISTER: "/api/v1/auth/signup",
    LOGOUT: "/api/v1/auth/logout",
    REFRESH: "/api/v1/auth/refresh",
    ME: "/api/v1/auth/me",
  },
  ACCOUNTS: {
    BASE: "/api/v1/accounts",
    DETAIL: (id: string) => `/api/v1/accounts/${id}`,
    BAN: (id: string) => `/api/v1/accounts/${id}/ban`,
  },
  ADMIN: {
    DASHBOARD: "/api/v1/admin/dashboard",
    CONFIG: "/api/v1/admin/config",
    BILLING_PLANS: "/api/v1/admin/billing/plans",
    BILLING_PLAN_DETAIL: (id: number | string) =>
      `/api/v1/admin/billing/plans/${id}`,
  },
  DOCUMENTS: {
    BASE: "/api/v1/documents",
    DETAIL: (id: string) => `/api/v1/documents/${id}`,
    FILE: (id: string) => `/api/v1/documents/${id}/file`,
    DOWNLOAD: (id: string) => `/api/v1/documents/${id}/download`,
    APPROVE: (id: string) => `/api/v1/documents/${id}/approve`,
    REJECT: (id: string) => `/api/v1/documents/${id}/reject`,
    RECLASSIFY: (id: string) => `/api/v1/documents/${id}/reclassify`,
    RESTORE: (id: string) => `/api/v1/documents/${id}/restore`,
    HARD_DELETE: (id: string) => `/api/v1/documents/${id}/hard`,
    SHARE: (id: string) => `/api/v1/documents/${id}/share`,
    SHARED: (token: string) => `/api/v1/documents/share/${token}`,
  },
  SUBJECTS: {
    BASE: "/api/v1/subjects",
    DETAIL: (id: string) => `/api/v1/subjects/${id}`,
  },
  FOLDERS: {
    BASE: "/api/v1/folders",
    DETAIL: (id: string) => `/api/v1/folders/${id}`,
    CHAT: (id: string) => `/api/v1/folders/${id}/chat`,
  },
  RAG: {
    BASE: "/api/v1/rag",
    HEALTH: "/api/v1/rag/health",
    CHAT: "/api/v1/rag/chat",
    CHAT_STREAM: "/api/v1/rag/chat/stream",
    RETRIEVE: "/api/v1/rag/retrieve",
    INGEST: "/api/v1/rag/ingest",
    SOURCE: (id: string) => `/api/v1/rag/sources/${id}`,
  },
  BILLING: {
    SUMMARY: "/api/v1/billing/summary",
    DEMO_PURCHASE: "/api/v1/billing/demo-purchase",
    FLOW: "/api/v1/billing/flow",
  },
} as const;

export const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/ddxstobvd/image/upload/v1/default-avatar";

export const isDefaultAvatar = (url?: string | null): boolean => {
  return !url || url === DEFAULT_AVATAR_URL;
};
