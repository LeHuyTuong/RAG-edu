/**
 * Application Configuration
 */

export const APP_CONFIG = {
  // App Info
  name: "AI Study Hub",
  description: "Nền tảng chia sẻ kiến thức hàng đầu cho sinh viên",
  version: "1.0.0",

  // API Configuration
  api: {
    // Derive from the browser's current host so the same build works whether
    // opened via localhost or a Tailscale/LAN IP; falls back to the env var
    // during SSR where `window` isn't available.
    baseUrl:
      typeof window !== "undefined"
        ? `http://${window.location.hostname}:8080`
        : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    timeout: 15_000,
  },

  // Authentication
  auth: {
    tokenKey: "auth_token",
    userKey: "user_info",
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Pagination
  pagination: {
    defaultPerPage: 12,
    maxPerPage: 100,
  },

  // Upload
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedExtensions: ["pdf", "docx", "doc"],
  },

  // Feature Flags
  features: {
    enableSearch: true,
    enableFilters: true,
    enableUpload: false,
    enableComments: false,
  },
} as const;

export default APP_CONFIG;
