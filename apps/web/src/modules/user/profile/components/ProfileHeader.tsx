/**
 * ProfileHeader
 *
 * Purely presentational — renders the page title, subtitle, and the
 * "Bảo mật tài khoản" security notice banner.
 * No props or state needed.
 */
export function ProfileHeader(): React.JSX.Element {
  return (
    <div className="space-y-4">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Quản lý thông tin cá nhân và thiết lập bảo mật tài khoản của bạn.
        </p>
      </div>

      {/* Security notice banner */}
      <div className="flex gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <span className="material-symbols-outlined shrink-0 text-[20px] text-primary">
          security
        </span>
        <div className="text-sm">
          <p className="font-semibold text-on-surface">Bảo mật tài khoản</p>
          <p className="mt-0.5 text-on-surface-variant">
            Chúng tôi khuyến bạn nên sử dụng một khẩu mạnh và không chia sẻ
            thông tin đăng nhập với người khác để bảo vệ tài liệu học tập của
            mình.
          </p>
        </div>
      </div>
    </div>
  );
}
