import { APP_CONFIG } from "@/config";
import { buildUserFromAccessToken } from "@/lib/auth";
import { API_ENDPOINTS } from "@/shared/constants";
import { useAuthStore } from "@/stores/auth/store";

const GOOGLE_OAUTH_PENDING_STATE_KEY = "google_oauth_pending_state";

interface BuildGoogleLoginUrlOptions {
  apiBaseUrl?: string;
  deviceId: string;
  redirectPath?: string | null;
  oauthState?: string;
}

export const buildGoogleLoginUrl = ({
  apiBaseUrl = APP_CONFIG.api.baseUrl,
  deviceId,
  redirectPath,
  oauthState,
}: BuildGoogleLoginUrlOptions): string => {
  const baseUrl = `${apiBaseUrl}${API_ENDPOINTS.AUTH.GOOGLE}`;
  const params = new URLSearchParams({ deviceId });

  if (redirectPath) {
    params.set("redirectPath", redirectPath);
  }

  if (oauthState) {
    params.set("clientState", oauthState);
  }

  return `${baseUrl}?${params.toString()}`;
};

const createGoogleOauthState = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `google-oauth-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getPendingGoogleOauthState = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return sessionStorage.getItem(GOOGLE_OAUTH_PENDING_STATE_KEY);
  } catch {
    return null;
  }
};

const clearPendingGoogleOauthState = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.removeItem(GOOGLE_OAUTH_PENDING_STATE_KEY);
  } catch {
    // Browser storage can be blocked; invalid state will reject token use.
  }
};

export const markGoogleOauthPending = (): string => {
  const state = createGoogleOauthState();

  if (typeof window === "undefined") {
    return state;
  }

  try {
    sessionStorage.setItem(GOOGLE_OAUTH_PENDING_STATE_KEY, state);
  } catch {
    // Browser storage can be blocked; callback validation will fail closed.
  }

  return state;
};

export const consumeGoogleAccessTokenFromHash = (
  hash: string,
): string | null => {
  const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(normalizedHash);

  if (params.has("googleError")) {
    return null;
  }

  const accessToken = params.get("googleAccessToken");
  const returnedState = params.get("googleState");
  const pendingState = getPendingGoogleOauthState();

  if (
    !accessToken ||
    !returnedState ||
    !pendingState ||
    returnedState !== pendingState
  ) {
    return null;
  }

  clearPendingGoogleOauthState();

  return accessToken;
};

export const completeGoogleLoginFromLocation = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const accessToken = consumeGoogleAccessTokenFromHash(window.location.hash);

  if (!accessToken) {
    return false;
  }

  const user = buildUserFromAccessToken(accessToken);

  if (!user) {
    return false;
  }

  useAuthStore.getState().setAuth(accessToken, user.role, user, null);
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );

  return true;
};
