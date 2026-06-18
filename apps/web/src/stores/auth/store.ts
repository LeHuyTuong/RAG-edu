import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { UserRole } from "@/shared/types";
import type { User } from "./types";

interface AuthState {
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
  logout: () => void;
  setLoginPromptOpen: (open: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
          user,
          isAuthenticated: true,
        }),
      setAccessToken: (accessToken) =>
        set((state) => ({
          ...state,
          accessToken,
          isAuthenticated: Boolean(accessToken || state.user),
        })),
      setUser: (user) =>
        set((state) => ({
          ...state,
          user,
          role: user?.role ?? state.role,
          isAuthenticated: Boolean(state.accessToken || user),
        })),
      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          role: null,
          user: null,
          isAuthenticated: false,
        });
        localStorage.removeItem("auth-storage");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_info");
      },
      setLoginPromptOpen: (open) => set({ isLoginPromptOpen: open }),
    }),
    {
      name: "auth-storage",
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => localStorage)
          : undefined,
      partialize: (state) => ({
        accessToken: state.accessToken,
        role: state.role,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
