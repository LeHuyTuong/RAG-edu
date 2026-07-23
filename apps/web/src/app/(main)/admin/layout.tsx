import type { ReactNode } from "react";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AdminShell } from "@/features/admin/components/AdminShell";

/**
 * FLOW DOC: apps/web/docs/FRONTEND-CODE-FLOW-VI.md#flow-admin
 * Admin layout áp dụng auth guard với requiredRole="admin" cho toàn bộ nhánh.
 */

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
