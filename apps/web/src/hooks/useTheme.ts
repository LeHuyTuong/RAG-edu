"use client";

import { useThemeStore, type Theme } from "@/stores";

export function useTheme(): {
  theme: Theme;
  isDark: boolean;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
} {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const setTheme = useThemeStore((state) => state.setTheme);

  return {
    theme,
    isDark: theme === "dark",
    toggle: toggleTheme,
    setTheme,
  };
}
