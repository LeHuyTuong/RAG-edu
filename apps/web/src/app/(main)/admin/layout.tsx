import type { ReactNode } from "react";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AdminShell } from "@/modules/admin/components/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminShell> {children}</AdminShell>
    </ProtectedRoute>
  );
}
