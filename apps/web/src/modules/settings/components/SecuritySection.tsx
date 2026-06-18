"use client";

// Consolidation point: password-change logic from modules/user/profile/components/SecurityForm
// is surfaced here as the unified security tab for user and moderator settings.
import { SecurityForm } from "@/modules/user/profile/components/SecurityForm";

export function SecuritySection(): React.JSX.Element {
  return <SecurityForm />;
}
