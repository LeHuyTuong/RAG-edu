"use client";

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/shared/constants";
import { useAuthStore } from "@/stores";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home(): ReactElement {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <header className="flex items-center justify-between px-10 py-4 border-b border-outline-variant bg-surface">
        <Link href="/" className="flex items-center gap-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <path
              d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3ZM12 12.8L4.08 8.46L12 4.07L19.92 8.46L12 12.8Z"
              fill="currentColor"
            />
            <path d="M4 14V18H10V14" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="text-xl font-bold text-primary">AcademiShare</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-on-surface font-semibold text-sm hover:text-primary transition-all duration-200 py-1 border-b-2 border-primary"
          >
            Trang chủ
          </Link>
          <Link
            href="/library"
            className="text-on-surface-variant font-semibold text-sm hover:text-primary transition-all duration-200 py-1 border-b-2 border-transparent hover:border-primary"
          >
            Thư viện
          </Link>
          <Link
            href="/community"
            className="text-on-surface-variant font-semibold text-sm hover:text-primary transition-all duration-200 py-1 border-b-2 border-transparent hover:border-primary"
          >
            Cộng đồng
          </Link>
          <Link
            href="/uploads"
            className="text-on-surface-variant font-semibold text-sm hover:text-primary transition-all duration-200 py-1 border-b-2 border-transparent hover:border-primary"
          >
            Tải lên
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {mounted && isAuthenticated && user ? (
            <div className="flex items-center gap-6">
              <Link
                href={
                  user.role === "admin"
                    ? "/admin"
                    : user.role === "moderator"
                      ? "/moderator"
                      : "/profile"
                }
                className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
              >
                Xin chào, <span className="text-primary">{user.name}</span> (
                {user.role === "admin"
                  ? "Admin"
                  : user.role === "moderator"
                    ? "KTV"
                    : "Học viên"}
                )
              </Link>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, null, {
                      skipToast: true,
                    });
                  } finally {
                    logout();
                  }
                }}
                className="text-xs text-error hover:text-error/85 underline transition-colors cursor-pointer font-medium"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/register"
                className="text-sm font-bold text-on-surface-variant transition-colors hover:text-primary"
              >
                Đăng ký
              </Link>
              <Link
                href="/login"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-7 py-2.5 rounded-full text-sm shadow-sm transition-colors duration-200 cursor-pointer"
              >
                Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-10 py-12 w-full flex flex-col gap-24">
        <section className="grid grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-6 max-w-xl">
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-on-surface">
              Kho lưu trữ tài liệu{" "}
              <span className="text-primary">học thuật hàng đầu</span> cho sinh
              viên
            </h1>
            <p className="text-lg leading-relaxed text-on-surface-variant">
              Nền tảng chia sẻ kiến thức toàn diện, nơi bạn có thể tìm kiếm hàng
              triệu giáo trình, đề thi và bài giảng chất lượng từ cộng đồng sinh
              viên ưu tú.
            </p>
            <div className="flex items-center bg-surface-container border border-outline-variant rounded-xl p-1 shadow-sm mt-4 transition-colors duration-200">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-on-surface-variant mx-3 shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu, khóa học..."
                className="flex-1 border-none outline-none px-2 py-2 bg-transparent text-on-surface placeholder-on-surface-variant"
              />
              <button
                type="button"
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Khám phá
              </button>
            </div>
          </div>
          <div className="w-full h-96 rounded-3xl overflow-hidden shadow-lg bg-surface-container-high" />
        </section>

        <section className="flex flex-col items-center gap-10 bg-primary/5 rounded-4xl px-12 py-16 transition-colors duration-200">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-on-surface mb-3">
              Tính năng cốt lõi
            </h2>
            <p className="text-lg text-on-surface-variant">
              Trải nghiệm học tập không giới hạn với hệ sinh thái cùng công cụ
              hiện đại
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 w-full">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 shadow-sm flex flex-col gap-4 relative overflow-hidden min-h-80 transition-colors duration-200">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary transition-colors duration-200">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-on-surface">
                Thư viện tài liệu đa dạng
              </h3>
              <p className="text-on-surface-variant">
                Hơn 1,000,000+ tài liệu được phân loại theo từng chuyên ngành và
                trường đại học.
              </p>
            </div>
            <div className="bg-primary rounded-3xl p-8 shadow-lg flex flex-col gap-4 relative overflow-hidden min-h-80 transition-colors duration-200">
              <div className="w-12 h-12 bg-primary-foreground/15 rounded-lg flex items-center justify-center text-primary-foreground transition-colors duration-200">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-primary-foreground">
                Đóng góp và chia sẻ
              </h3>
              <p className="text-primary-foreground/90">
                Tạo ra tài liệu của bạn chỉ với một vài bước đơn giản và nhận
                điểm thưởng từ cộng đồng.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
