import type { ReactNode } from "react";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { ModeratorShell } from "@/modules/moderator/components/ModeratorShell";

export default function ModeratorLayout({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  return (
    <ProtectedRoute requiredRole="moderator">
      <ModeratorShell>{children}</ModeratorShell>
    </ProtectedRoute>
  );
}
