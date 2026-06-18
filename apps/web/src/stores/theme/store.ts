import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  hasHydrated: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

/**
 * Zustand store for theme – persisted into localStorage.
 * DOM synchronization is handled exclusively by ThemeProvider.
 * Initial loading & OS preferences check is handled by the blocking script in layout.tsx.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system", // Default fallback; overridden by persisted state on hydration
      hasHydrated: false,

      toggleTheme: () => {
        const current = get().theme;
        let next: Theme;
        if (current === "light") {
          next = "dark";
        } else if (current === "dark") {
          next = "system";
        } else {
          next = "light";
        }
        set({ theme: next });
      },

      setTheme: (theme) => {
        set({ theme });
      },

      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
