import { semanticColors, type ThemeName } from "@repo/tokens";

function toCssVars(theme: ThemeName) {
  const colors = semanticColors[theme];

  return [
    `--background: ${colors.background};`,
    `--foreground: ${colors.text};`,
    `--surface: ${colors.backgroundElement};`,
    `--surface-elevated: ${colors.backgroundSelected};`,
    `--outline: ${theme === "light" ? "#b3afc0" : "#938ea1"};`,
    `--primary: ${theme === "light" ? "#6d4cff" : "#cabeff"};`,
    `--primary-contrast: ${theme === "light" ? "#ffffff" : "#32009a"};`,
  ].join("\n");
}

export function createWebThemeStyles() {
  return `:root {\n${toCssVars("light")}\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n${toCssVars(
    "dark",
  )
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n")}\n  }\n}`;
}
