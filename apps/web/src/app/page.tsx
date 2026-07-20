"use client";

import Link from "next/link";
import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { apiClient } from "@/lib/axios";
import { API_ENDPOINTS } from "@/shared/constants";
import { useAuthStore } from "@/stores";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useInView } from "@/hooks/useInView";

/* ── Scroll-reveal wrapper ── */

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Hero illustration with float ── */

function HeroIllustration() {
  return (
    <div className="relative w-full h-full min-h-[420px] flex items-center justify-center animate-float">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(0,46,143,0.08)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_60%_40%,rgba(77,163,255,0.07)_0%,transparent_70%)]" />

      <div className="relative w-72 h-80">
        {/* Back card */}
        <div className="absolute top-4 left-6 w-64 h-72 rounded-2xl bg-surface-container-high border border-outline-variant shadow-lg rotate-[-4deg] opacity-70">
          <div className="p-5 flex flex-col gap-3">
            <div className="w-3/4 h-2 rounded-full bg-outline-variant/40" />
            <div className="w-full h-2 rounded-full bg-outline-variant/30" />
            <div className="w-5/6 h-2 rounded-full bg-outline-variant/30" />
            <div className="w-2/3 h-2 rounded-full bg-outline-variant/30" />
            <div className="mt-3 w-1/2 h-3 rounded-full bg-primary/20" />
            <div className="w-full h-1.5 rounded-full bg-outline-variant/20" />
            <div className="w-4/5 h-1.5 rounded-full bg-outline-variant/20" />
            <div className="w-3/4 h-1.5 rounded-full bg-outline-variant/20" />
          </div>
        </div>

        {/* Front card */}
        <div className="absolute top-8 right-6 w-64 h-80 rounded-2xl bg-surface border border-outline-variant shadow-xl z-10 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-on-surface-variant">
                Tư liệu lịch sử
              </span>
            </div>
            <div className="w-3/4 h-3 rounded-full bg-primary/15" />
            <div className="w-full h-2 rounded-full bg-outline-variant/30" />
            <div className="w-5/6 h-2 rounded-full bg-outline-variant/30" />
            <div className="w-4/5 h-2 rounded-full bg-outline-variant/30" />
            <div className="w-2/3 h-2 rounded-full bg-outline-variant/30" />
            <div className="mt-2 w-full h-2 rounded-full bg-outline-variant/20" />
            <div className="w-3/4 h-2 rounded-full bg-outline-variant/20" />
            <div className="w-5/6 h-2 rounded-full bg-outline-variant/20" />
            <div className="w-1/2 h-2 rounded-full bg-outline-variant/20" />
            <div className="mt-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary">
                  AI-RAG
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating nodes */}
        <div className="absolute top-2 left-12 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center z-20 shadow-md">
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>
        <div className="absolute bottom-16 left-2 w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center z-20 shadow-md">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
        <div className="absolute top-28 right-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center z-20 shadow-sm">
          <div className="w-1 h-1 rounded-full bg-primary" />
        </div>

        <svg
          className="absolute inset-0 w-full h-full z-5 pointer-events-none"
          viewBox="0 0 288 320"
          fill="none"
        >
          <line
            x1="68"
            y1="24"
            x2="200"
            y2="52"
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="1"
            strokeDasharray="4 3"
            className="text-primary"
          />
          <line
            x1="20"
            y1="240"
            x2="200"
            y2="80"
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeWidth="1"
            strokeDasharray="4 3"
            className="text-primary"
          />
          <line
            x1="264"
            y1="150"
            x2="230"
            y2="100"
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeWidth="1"
            strokeDasharray="4 3"
            className="text-primary"
          />
        </svg>
      </div>
    </div>
  );
}

/* ── Feature card with hover lift & glow ── */

function FeatureCard({
  icon,
  title,
  description,
  accent = false,
}: {
  icon: ReactElement;
  title: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`group relative rounded-2xl p-8 transition-all duration-400 ease-out border cursor-default
        hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10
        ${
          accent
            ? "bg-primary border-primary shadow-lg shadow-primary/20"
            : "bg-surface border-outline-variant shadow-sm hover:border-primary/40"
        }`}
    >
      {/* Top glow line on hover */}
      {!accent && (
        <div className="absolute top-0 left-8 right-8 h-0.5 rounded-full bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      {/* Icon with gentle rotation on hover */}
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5
          transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
          ${accent ? "bg-white/15 text-white" : "bg-primary/8 text-primary"}`}
      >
        {icon}
      </div>

      <h3
        className={`text-xl font-bold mb-3 ${accent ? "text-white" : "text-on-surface"}`}
      >
        {title}
      </h3>

      <p
        className={`leading-relaxed ${accent ? "text-white/85" : "text-on-surface-variant"}`}
      >
        {description}
      </p>
    </div>
  );
}

/* ── FEATURE ICONS ── */

const DocIcon = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="14" y2="11" />
    <line x1="8" y1="15" x2="12" y2="15" />
  </svg>
);

const AIIcon = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
    <path d="M8 9h8" />
    <path d="M8 13h5" />
    <path d="M8 17h6" />
    <circle cx="17" cy="8" r="1" fill="currentColor" />
    <circle cx="18" cy="12" r="1" fill="currentColor" />
    <circle cx="16" cy="16" r="1" fill="currentColor" />
  </svg>
);

const CommunityIcon = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

/* ── MAIN PAGE ── */

export default function Home(): ReactElement {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Trigger hero stagger after mount
    const t = setTimeout(() => setHeroLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      {/* ══════ HEADER ══════ */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/60 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25 transition-transform duration-200 group-hover:scale-105">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <path
                  d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3Z"
                  fill="currentColor"
                />
                <path
                  d="M4 14V18H10V14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold text-on-surface tracking-tight transition-colors duration-300">
                HisWise
              </span>
              <span className="hidden sm:inline text-xs font-medium text-on-surface-variant ml-2 transition-colors duration-300">
                RAG-edu
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {[
              { href: "/", label: "Trang chủ" },
              { href: "/library", label: "Kho tư liệu" },
              { href: "/community", label: "Thảo luận" },
              { href: "/uploads", label: "Đăng tải" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors duration-200 rounded-lg"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {mounted && isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold text-on-surface leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {user.role === "admin"
                        ? "Quản trị viên"
                        : user.role === "moderator"
                          ? "Kiểm duyệt viên"
                          : "Học viên"}
                    </p>
                  </div>
                </div>
                <Link
                  href={
                    user.role === "admin"
                      ? "/admin"
                      : user.role === "moderator"
                        ? "/moderator"
                        : "/profile"
                  }
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Trang cá nhân
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
                  className="text-xs font-medium text-error/70 hover:text-error transition-colors cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/register"
                  className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
                >
                  Đăng ký
                </Link>
                <Link
                  href="/login"
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-5 py-2 rounded-full text-sm shadow-sm shadow-primary/20 transition-all duration-200 cursor-pointer hover:shadow-md hover:shadow-primary/25 hover:scale-105 active:scale-95"
                >
                  Đăng nhập
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══════ HERO SECTION ══════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F3F6FA] via-[#F8FAFD] to-background dark:from-gray-950 dark:via-slate-900/80 dark:to-background transition-colors duration-300">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, var(--primary) 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* ── Left: Text + Search with staggered entrance ── */}
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-5">
                {/* Badge — delay 0 */}
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 w-fit transition-all duration-700 ease-out
                    ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                  style={{ transitionDelay: "0ms" }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                    Hệ thống RAG-edu
                  </span>
                </div>

                {/* Heading — delay 100ms */}
                <h1
                  className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-on-surface transition-all duration-700 ease-out
                    ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                  style={{ transitionDelay: "100ms" }}
                >
                  Kho lưu trữ{" "}
                  <span className="text-primary transition-colors duration-300">
                    tư liệu lịch sử
                  </span>{" "}
                  hàng đầu cho nghiên cứu và giảng dạy
                </h1>

                {/* Subtext — delay 200ms */}
                <p
                  className={`text-lg leading-relaxed text-on-surface-variant max-w-lg transition-all duration-700 ease-out
                    ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                  style={{ transitionDelay: "200ms" }}
                >
                  Nền tảng chia sẻ tri thức lịch sử, nơi bạn có thể tìm kiếm
                  hàng nghìn tư liệu, văn bản gốc và bài nghiên cứu chất lượng
                  từ cộng đồng học giả.
                </p>
              </div>

              {/* Search bar — delay 350ms + focus glow */}
              <div
                className={`flex items-center bg-surface border border-outline-variant/70 rounded-2xl p-1.5 shadow-sm
                  transition-all duration-300 ease-out
                  focus-within:shadow-lg focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10
                  ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: "350ms" }}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/6 shrink-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-primary"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm tư liệu lịch sử, sự kiện, nhân vật..."
                  className="flex-1 border-none outline-none px-3 py-2.5 bg-transparent text-on-surface placeholder-on-surface-variant/60 text-sm"
                />
                <button
                  type="button"
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 rounded-xl text-sm
                    shadow-sm shadow-primary/20 transition-all duration-200 cursor-pointer whitespace-nowrap
                    hover:scale-105 active:scale-95 hover:shadow-md hover:shadow-primary/25"
                >
                  Tìm kiếm
                </button>
              </div>

              {/* Stats — delay 500ms */}
              <div
                className={`flex items-center gap-8 pt-2 transition-all duration-700 ease-out
                  ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: "500ms" }}
              >
                {[
                  { value: "1,200+", label: "Tư liệu" },
                  { value: "850+", label: "Học giả" },
                  { value: "15+", label: "Giai đoạn" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col">
                    <span className="text-2xl font-bold text-on-surface">
                      {stat.value}
                    </span>
                    <span className="text-sm text-on-surface-variant">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Illustration with float ── */}
            <div
              className={`transition-all duration-800 ease-out
                ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: "300ms" }}
            >
              <HeroIllustration />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* ══════ FEATURES SECTION ══════ */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3 bg-primary/8 px-3 py-1 rounded-full">
              Tính năng cốt lõi
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-on-surface mb-4 tracking-tight transition-colors duration-300">
              Hệ sinh thái nghiên cứu lịch sử toàn diện
            </h2>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed transition-colors duration-300">
              Khám phá tri thức lịch sử với hệ sinh thái tư liệu và công cụ tra
              cứu hiện đại, được hỗ trợ bởi công nghệ AI tiên tiến
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            <AnimatedSection delay={100}>
              <FeatureCard
                icon={DocIcon}
                title="Kho tư liệu"
                description="Hàng nghìn tư liệu lịch sử được phân loại theo giai đoạn, sự kiện và nhân vật. Dễ dàng tìm kiếm, xem trước và tải về tài liệu gốc chất lượng cao."
              />
            </AnimatedSection>
            <AnimatedSection delay={250}>
              <FeatureCard
                accent
                icon={AIIcon}
                title="Hỏi đáp AI"
                description="Trợ lý AI thông minh sử dụng công nghệ RAG, trả lời câu hỏi dựa trên tư liệu gốc có căn cứ. Tra cứu nhanh, chính xác, có trích dẫn nguồn rõ ràng."
              />
            </AnimatedSection>
            <AnimatedSection delay={400}>
              <FeatureCard
                icon={CommunityIcon}
                title="Quản lý & Cộng đồng"
                description="Hệ thống quản lý tài liệu và người dùng toàn diện. Đóng góp tư liệu, thảo luận học thuật, và cùng xây dựng kho tri thức chung cho cộng đồng nghiên cứu."
              />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ══════ ABOUT SECTION ══════ */}
      <section className="bg-[#F3F6FA] dark:bg-slate-900/50 py-24 px-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection className="flex flex-col gap-6">
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-1 bg-primary/8 px-3 py-1 rounded-full w-fit">
                Về dự án
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight leading-tight transition-colors duration-300">
                Hệ thống RAG-edu:{" "}
                <span className="text-primary transition-colors duration-300">
                  Trí tuệ nhân tạo
                </span>{" "}
                phục vụ nghiên cứu lịch sử
              </h2>
              <p className="text-lg leading-relaxed text-on-surface-variant transition-colors duration-300">
                RAG-edu là hệ thống quản lý tài liệu lịch sử thông minh, kết hợp
                AI tiên tiến và công nghệ Retrieval-Augmented Generation để cung
                cấp tra cứu chính xác, có căn cứ. Dự án giúp bảo tồn và tối ưu
                hóa việc nghiên cứu tư liệu lịch sử số, đồng thời tạo ra một nền
                tảng học thuật mở cho cộng đồng.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-2">
                {[
                  {
                    label: "Tư liệu có căn cứ",
                    desc: "Mọi câu trả lời đều dựa trên tài liệu gốc",
                  },
                  {
                    label: "Công nghệ AI",
                    desc: "Gemini + RAG cho độ chính xác cao",
                  },
                  {
                    label: "Bảo tồn số",
                    desc: "Số hóa và lưu trữ tư liệu lịch sử",
                  },
                  {
                    label: "Cộng đồng mở",
                    desc: "Chia sẻ và đóng góp tri thức",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 p-4 rounded-xl bg-surface/70 border border-outline-variant/40 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-primary shrink-0 mt-0.5"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">
                        {item.label}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="relative">
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-outline-variant/50 flex items-center justify-center overflow-hidden transition-colors duration-300">
                  <div className="relative w-64 h-64">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/10" />
                    <div className="absolute inset-4 rounded-full border border-primary/15" />
                    <div className="absolute inset-10 rounded-full border border-primary/20" />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center">
                        <svg
                          width="44"
                          height="44"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-white"
                        >
                          <path
                            d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3Z"
                            fill="currentColor"
                          />
                          <path
                            d="M4 14V18H10V14"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary animate-pulse" />
                    <div className="absolute bottom-8 right-8 w-2 h-2 rounded-full bg-primary/60" />
                    <div className="absolute bottom-6 left-6 w-2.5 h-2.5 rounded-full bg-primary/70" />
                    <div className="absolute top-14 right-4 w-2 h-2 rounded-full bg-primary/50" />
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="bg-surface border-t border-outline-variant/60 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white"
                  >
                    <path
                      d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3Z"
                      fill="currentColor"
                    />
                    <path
                      d="M4 14V18H10V14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-bold text-on-surface transition-colors duration-300">
                    HisWise
                  </span>
                  <span className="text-xs text-on-surface-variant ml-1.5 transition-colors duration-300">
                    RAG-edu
                  </span>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                Hệ thống quản lý tư liệu lịch sử thông minh, kết hợp AI và công
                nghệ RAG phục vụ nghiên cứu và giảng dạy.
              </p>
              <p className="text-xs text-on-surface-variant/70">
                © {new Date().getFullYear()} HisWise RAG-edu. Bảo lưu mọi quyền.
              </p>
            </div>

            {[
              {
                title: "Nền tảng",
                links: [
                  { label: "Trang chủ", href: "/" },
                  { label: "Kho tư liệu", href: "/library" },
                  { label: "Thảo luận", href: "/community" },
                  { label: "Đăng tải", href: "/uploads" },
                ],
              },
              {
                title: "Hỗ trợ",
                links: [
                  { label: "Hướng dẫn", href: "#" },
                  { label: "Câu hỏi thường gặp", href: "#" },
                  { label: "Liên hệ", href: "#" },
                  { label: "Báo cáo lỗi", href: "#" },
                ],
              },
              {
                title: "Pháp lý",
                links: [
                  { label: "Điều khoản sử dụng", href: "#" },
                  { label: "Chính sách bảo mật", href: "#" },
                  { label: "Bản quyền tư liệu", href: "#" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-sm text-on-surface mb-4">
                  {col.title}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-on-surface-variant hover:text-primary transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-on-surface-variant/60">
              Phát triển bởi cộng đồng RAG-edu. Mã nguồn mở trên GitHub.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-on-surface-variant/60">
                Phiên bản 1.0.0
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
