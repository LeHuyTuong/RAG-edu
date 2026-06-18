export type SettingsTab = "theme" | "language" | "account";

export interface SettingsNavItem {
  readonly key: SettingsTab;
  readonly label: string;
  readonly icon: string;
}
