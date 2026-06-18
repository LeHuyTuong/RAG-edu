import { UserShell } from "@/modules/user/components/UserShell";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import type { ReactNode } from "react";

export default function UserLayout({
  children,
}: {
  readonly children: ReactNode;
}): React.JSX.Element {
  return (
    <ProtectedRoute>
      <UserShell
        title="Không gian học tập"
        subtitle="Quản lý tài liệu và đóng góp của bạn"
      >
        {children}
      </UserShell>
    </ProtectedRoute>
  );
}
