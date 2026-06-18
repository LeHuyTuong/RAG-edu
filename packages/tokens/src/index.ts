export const colors = {
  light: {
    background: "#f8f7fb",
    onBackground: "#1c1a24",
    surface: "#ffffff",
    surfaceContainerLowest: "#ffffff",
    surfaceContainerLow: "#f2f0f6",
    surfaceContainer: "#e8e5f0",
    surfaceContainerHigh: "#ddd9e6",
    surfaceContainerHighest: "#d3cedf",
    surfaceVariant: "#e6e1ee",
    onSurface: "#1c1a24",
    onSurfaceVariant: "#5e5a6b",
    outline: "#b3afc0",
    primary: "#6d4cff",
    onPrimary: "#ffffff",
    primaryContainer: "#e0d8ff",
    onPrimaryContainer: "#2b0088",
    secondary: "#5a4b7e",
    onSecondary: "#ffffff",
    secondaryContainer: "#dad2eb",
    onSecondaryContainer: "#332d41",
    tertiary: "#7751b5",
    onTertiary: "#ffffff",
    tertiaryContainer: "#e1d7f0",
    onTertiaryContainer: "#2f2440",
    error: "#ba1a1a",
    onError: "#ffffff",
    errorContainer: "#ffdad6",
    onErrorContainer: "#93000a",
  },
  dark: {
    background: "#111318",
    onBackground: "#e2e2e9",
    surface: "#1d2025",
    surfaceContainerLowest: "#0c0e13",
    surfaceContainerLow: "#191c20",
    surfaceContainer: "#1d2025",
    surfaceContainerHigh: "#282a2f",
    surfaceContainerHighest: "#33353a",
    surfaceVariant: "#33353a",
    onSurface: "#e2e2e9",
    onSurfaceVariant: "#c9c4d7",
    outline: "#938ea1",
    primary: "#cabeff",
    onPrimary: "#32009a",
    primaryContainer: "#947dff",
    onPrimaryContainer: "#2b0088",
    secondary: "#ccc2db",
    onSecondary: "#332d41",
    secondaryContainer: "#4c465a",
    onSecondaryContainer: "#bdb4cd",
    tertiary: "#c9c4d2",
    onTertiary: "#312f39",
    tertiaryContainer: "#928f9b",
    onTertiaryContainer: "#2a2833",
    error: "#ffb4ab",
    onError: "#690005",
    errorContainer: "#93000a",
    onErrorContainer: "#ffdad6",
  },
} as const;

export const semanticColors = {
  light: {
    text: colors.light.onBackground,
    background: colors.light.background,
    backgroundElement: colors.light.surfaceContainerLow,
    backgroundSelected: colors.light.surfaceContainer,
    textSecondary: colors.light.onSurfaceVariant,
  },
  dark: {
    text: colors.dark.onBackground,
    background: colors.dark.background,
    backgroundElement: colors.dark.surfaceContainerLow,
    backgroundSelected: colors.dark.surfaceContainerHigh,
    textSecondary: colors.dark.onSurfaceVariant,
  },
} as const;

export type ThemeName = keyof typeof semanticColors;
export type ThemeColorName = keyof typeof semanticColors.light;

export const spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const fontFamilies = {
  body: '"Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  display:
    '"Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  serif: 'Georgia, "Times New Roman", serif',
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
} as const;

export const typography = {
  "headline-lg": {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 700,
  },
  "headline-lg-mobile": {
    fontFamily: fontFamilies.display,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 700,
  },
  "headline-md": {
    fontFamily: fontFamilies.display,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 600,
  },
  "body-lg": {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 400,
  },
  "body-md": {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 400,
  },
  "label-md": {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
} as const;

export function getThemeColors(theme: ThemeName) {
  return semanticColors[theme];
}
