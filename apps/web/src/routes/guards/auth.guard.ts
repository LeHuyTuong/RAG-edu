/**
 * Authentication Guard
 * Middleware to protect routes that require authentication
 * Can be used in middleware.ts or as a wrapper component
 */

import { USER_PROTECTED_ROUTES } from "../user/user.routes";
import { isAuthRoute } from "../user/user.auth.routes";

export interface GuardContext {
  pathname: string;
  isAuthenticated: boolean;
  userRole?: "guest" | "student" | "teacher" | "moderator" | "admin";
  token?: string;
}

export interface AuthSession {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: "guest" | "student" | "teacher" | "moderator" | "admin";
  } | null;
  accessToken: string | null;
}

type StoredAuthState = {
  state?: {
    accessToken?: string | null;
    isAuthenticated?: boolean;
    user?: AuthSession["user"];
  };
};

const matchesRouteSegment = (pathname: string, route: string): boolean => {
  return pathname === route || pathname.startsWith(`${route}/`);
};

const isVerifyEmailRoute = (pathname: string): boolean =>
  pathname.startsWith("/verify-email/");

const readStoredAuthState = (): StoredAuthState | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as StoredAuthState;
  } catch {
    return null;
  }
};

/**
 * Check if user can access this route
 */
export const canAccessRoute = (context: GuardContext): boolean => {
  const { pathname, isAuthenticated } = context;

  // Protected routes require authentication
  if (
    USER_PROTECTED_ROUTES.some((route) => matchesRouteSegment(pathname, route))
  ) {
    return isAuthenticated;
  }

  // Auth routes should only be accessed by unauthenticated users
  if (isAuthRoute(pathname) && !isVerifyEmailRoute(pathname)) {
    return !isAuthenticated;
  }

  // All other routes are public
  return true;
};

/**
 * Redirect logic for unauthenticated users
 */
export const getAuthRedirect = (
  pathname: string,
  isAuthenticated: boolean,
): string | null => {
  // If trying to access protected route without auth, redirect to login
  if (
    !isAuthenticated &&
    USER_PROTECTED_ROUTES.some((route) => matchesRouteSegment(pathname, route))
  ) {
    return `/login?redirect=${encodeURIComponent(pathname)}`;
  }

  // If authenticated and trying to access auth routes, redirect to home
  if (
    isAuthenticated &&
    isAuthRoute(pathname) &&
    !isVerifyEmailRoute(pathname)
  ) {
    return "/home";
  }

  return null;
};

/**
 * Extract token from localStorage (for client-side)
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const parsed = readStoredAuthState();
  if (parsed?.state?.accessToken) {
    return parsed.state.accessToken;
  }
  return localStorage.getItem("auth_token");
};

/**
 * Extract user from localStorage (for client-side)
 */
export const getAuthUser = () => {
  const parsed = readStoredAuthState();
  if (parsed?.state?.user) {
    return parsed.state.user;
  }

  if (typeof window === "undefined") return null;

  const user = localStorage.getItem("user_info");
  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    // Invalid localStorage payload should not break route guard flow
    localStorage.removeItem("user_info");
    return null;
  }
};

export const getAuthSession = (): AuthSession => {
  if (typeof window === "undefined") {
    return {
      accessToken: null,
      user: null,
      isAuthenticated: false,
    };
  }

  const parsed = readStoredAuthState();
  const accessToken = parsed?.state?.accessToken ?? null;
  const user = parsed?.state?.user ?? getAuthUser();
  const isAuthenticated =
    parsed?.state?.isAuthenticated ?? Boolean(accessToken || user);

  return {
    accessToken,
    user,
    isAuthenticated,
  };
};
