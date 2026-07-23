import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { User, UserRole } from "@/types";

interface AuthSessionState {
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoginPromptOpen: boolean;
  setAuth: (
    accessToken: string | null,
    role: UserRole,
    user?: User,
    refreshToken?: string | null,
  ) => void;
  setAccessToken: (accessToken: string | null) => void;
  setUser: (user: User | null) => void;
  clearSession: () => void;
  logout: () => void;
  setLoginPromptOpen: (open: boolean) => void;
}

export const useAuthStore = create<AuthSessionState>()(
  persist(
    (set) => {
      const clearSession = () => {
        set({
          accessToken: null,
          refreshToken: null,
          role: null,
          user: null,
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
        refreshToken: null,
        role: null,
        user: null,
        isAuthenticated: false,
        isLoginPromptOpen: false,
        setAuth: (accessToken, role, user, refreshToken) =>
          set({
            accessToken,
            refreshToken: refreshToken ?? null,
            role,
            user: user ?? null,
            isAuthenticated: Boolean(accessToken || user),
          }),
        setAccessToken: (accessToken) =>
          set((state) => ({
            accessToken,
            isAuthenticated: Boolean(accessToken || state.user),
          })),
        setUser: (user) =>
          set((state) => ({
            user,
            role: user?.role ?? state.role,
            isAuthenticated: Boolean(state.accessToken || user),
          })),
        clearSession,
        logout: clearSession,
        setLoginPromptOpen: (isLoginPromptOpen) => set({ isLoginPromptOpen }),
      };
    },
    {
      name: "auth-storage",
      storage:
        typeof window === "undefined"
          ? undefined
          : createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        role: state.role,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
