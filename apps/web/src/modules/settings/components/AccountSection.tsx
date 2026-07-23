"use client";

// Consolidation point: profile info form from modules/user/profile/components/PersonalInfoForm
// is surfaced here as the unified account tab for user settings.
import { PersonalInfoForm } from "@/modules/user/profile/components/PersonalInfoForm";
import { useAuth } from "@/features/auth";

export function AccountSection(): React.JSX.Element {
  const { user } = useAuth();

  if (!user) {
    return (
      <p className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
        Không thể tải thông tin tài khoản. Vui lòng đăng nhập lại.
      </p>
    );
  }

  return <PersonalInfoForm user={user} />;
}
