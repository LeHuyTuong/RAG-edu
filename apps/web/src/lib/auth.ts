import type { User } from "@/types";
import type { UserRole } from "@/shared/types";

type BackendAuthRole = "USER" | "ADMIN" | "MODERATOR" | "student" | "teacher";

type BackendAuthPayload = {
  sub: string;
  email?: string;
  name?: string;
  role: BackendAuthRole;
  status?: string;
  type?: string;
  jti?: string;
};

type RefreshTokenResponse = {
  refreshToken?: string;
};

type AccessTokenResponse = {
  accessToken?: string;
};

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded =
    padding === 0 ? normalized : normalized + "=".repeat(4 - padding);

  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return window.atob(padded);
  }

  const buffer = globalThis.Buffer;
  if (buffer) {
    return buffer.from(padded, "base64").toString("utf-8");
  }

  throw new Error("No base64 decoder available");
};

export const decodeJwtPayload = <T extends object>(token: string): T | null => {
  const parts = token.split(".");
  const payloadPart = parts[1];

  if (!payloadPart) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payloadPart)) as T;
  } catch {
    return null;
  }
};

export const normalizeUserRole = (role?: string): UserRole => {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return "admin";
    case "MODERATOR":
      return "moderator";
    case "TEACHER":
      return "teacher";
    case "USER":
    case "STUDENT":
      return "student";
    default:
      return "guest";
  }
};

export const buildUserFromAuthToken = (
  authToken?: string,
  fallback?: { email?: string; name?: string },
): User | null => {
  if (!authToken) {
    return null;
  }

  const payload = decodeJwtPayload<BackendAuthPayload>(authToken);
  if (!payload?.sub) {
    return null;
  }

  const email = payload.email ?? fallback?.email;
  const name =
    payload.name ??
    fallback?.name ??
    fallback?.email?.split("@")[0] ??
    fallback?.email ??
    email;

  if (!email || !name) {
    return null;
  }

  if (!payload.email || !payload.name) {
    console.warn(
      "[buildUserFromAuthToken] Auth token does not contain profile claims; using fallback session fields.",
      {
        hasEmailClaim: Boolean(payload.email),
        hasNameClaim: Boolean(payload.name),
      },
    );
  }

  return {
    id: payload.sub,
    email,
    name,
    role: normalizeUserRole(payload.role),
    status: payload.status,
    createdAt: new Date(),
  };
};

export const buildUserFromRefreshToken = buildUserFromAuthToken;
export const buildUserFromAccessToken = buildUserFromAuthToken;

export const extractRefreshToken = (response: unknown): string | null => {
  if (!response || typeof response !== "object") {
    return null;
  }

  const { refreshToken } = response as RefreshTokenResponse;
  return typeof refreshToken === "string" && refreshToken.length > 0
    ? refreshToken
    : null;
};

export const extractAccessToken = (response: unknown): string | null => {
  if (!response || typeof response !== "object") {
    return null;
  }

  const { accessToken } = response as AccessTokenResponse;
  return typeof accessToken === "string" && accessToken.length > 0
    ? accessToken
    : null;
};
