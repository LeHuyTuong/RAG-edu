"use client";

import { useLayoutEffect, useEffect, type ReactNode } from "react";
import { useThemeStore } from "@/stores";

// Safely toggle between useLayoutEffect on the client and useEffect on the server to avoid hydration warnings
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const theme = useThemeStore((state) => state.theme);
  const hasHydrated = useThemeStore((state) => state.hasHydrated);

  useIsomorphicLayoutEffect(() => {
    if (!hasHydrated) return;

    const root = document.documentElement;

    const applyTheme = (currentTheme: typeof theme) => {
      // Set the active data theme option attribute
      root.setAttribute("data-theme-option", currentTheme);

      let resolvedTheme: "light" | "dark";
      if (currentTheme === "system") {
        resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
      } else {
        resolvedTheme = currentTheme;
      }

      // Check before editing DOM to prevent redundant layout reflows
      if (!root.classList.contains(resolvedTheme)) {
        root.classList.remove("light", "dark");
        root.classList.add(resolvedTheme);
      }

      if (root.style.colorScheme !== resolvedTheme) {
        root.style.colorScheme = resolvedTheme;
      }
    };

    applyTheme(theme);

    if (theme !== "system") return;

    // Listen for system changes when theme option is set to system
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme, hasHydrated]);

  return <>{children}</>;
}
