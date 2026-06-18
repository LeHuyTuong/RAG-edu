"use client";

/**
 * ProfilePage (/profile)
 *
 * Data source: useAuthStore().user — the authenticated user is already held
 * in the store after login, so no separate API fetch is needed on mount.
 *
 * Layout: min-w-0 space-y-6 — consistent with /my-documents and /uploads.
 * The surrounding UserShell (via (app)/(user)/layout.tsx) provides the
 * SideNav, top padding, and background; this page adds no extra shell.
 *
 * Rendering is fully delegated to three child components:
 *  - ProfileHeader      → page title + security notice
 *  - PersonalInfoForm   → avatar + name/email/university fields + API save
 *  - SecurityForm       → password-change form
 */

import { useAuthStore } from "@/stores/auth/store";
import { ProfileHeader } from "./components/ProfileHeader";
import { PersonalInfoForm } from "./components/PersonalInfoForm";
import { SecurityForm } from "./components/SecurityForm";

export default function ProfilePage(): React.JSX.Element {
  const { user } = useAuthStore();

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
      <SecurityForm />
    </div>
  );
}
