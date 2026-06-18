export interface SideNavItem {
  readonly label: string;
  readonly icon: string;
  readonly href: string;
  readonly section: "main" | "secondary";
  readonly active?: boolean;
  readonly exact?: boolean;
  readonly action?: () => void;
}
