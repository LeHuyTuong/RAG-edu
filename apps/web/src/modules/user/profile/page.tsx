"use client";

/**
 * ProfilePage (/profile)
 *
 * Data source: useAuth().user — React Query loads and caches the
 * authenticated user after login, so this page has no fetch logic of its own.
 *
 * Layout: min-w-0 space-y-6 — consistent with /my-documents and /uploads.
 * The surrounding UserShell (via (app)/(user)/layout.tsx) provides the
 * SideNav, top padding, and background; this page adds no extra shell.
 *
 * Rendering is fully delegated to two child components:
 *  - ProfileHeader      → page title + security notice
 *  - PersonalInfoForm   → avatar + name/email/university fields + API save
 *
 * Đổi mật khẩu chưa được render ở đây vì backend Spring chưa có endpoint
 * change-password.
 */

import { useAuth } from "@/features/auth";
import { ProfileHeader } from "./components/ProfileHeader";
import { PersonalInfoForm } from "./components/PersonalInfoForm";

export default function ProfilePage(): React.JSX.Element {
  const { user } = useAuth();

  // Guard: this route is protected, but handle a missing user gracefully
  if (!user) {
    return (
      <div className="min-w-0 flex items-center justify-center py-24 text-center">
        <p className="text-sm text-on-surface-variant">
          Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <ProfileHeader />
      <PersonalInfoForm user={user} />
    </div>
  );
}
