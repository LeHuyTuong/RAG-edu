import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthSessionState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoginPromptOpen: boolean;
  setAccessToken: (accessToken: string | null) => void;
  clearSession: () => void;
  setLoginPromptOpen: (open: boolean) => void;
}

export const useAuthStore = create<AuthSessionState>()(
  persist(
    (set) => {
      const clearSession = () => {
        set({
          accessToken: null,
          isAuthenticated: false,
        });

        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_info");
        }
      };

      return {
        accessToken: null,
        isAuthenticated: false,
        isLoginPromptOpen: false,
        setAccessToken: (accessToken) =>
          set({ accessToken, isAuthenticated: Boolean(accessToken) }),
        clearSession,
        setLoginPromptOpen: (isLoginPromptOpen) => set({ isLoginPromptOpen }),
      };
    },
    {
      name: "auth-storage",
      storage:
        typeof window === "undefined"
          ? undefined
          : createJSONStorage(() => localStorage),
      version: 2,
      partialize: (state) => ({ accessToken: state.accessToken }),
      // Ignore stale profile/role fields left by the pre-feature store and
      // re-derive authentication from the only persisted session value.
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AuthSessionState>;
        const accessToken =
          typeof persisted.accessToken === "string"
            ? persisted.accessToken
            : null;

        return {
          ...currentState,
          accessToken,
          isAuthenticated: Boolean(accessToken),
        };
      },
    },
  ),
);
