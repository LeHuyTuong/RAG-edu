"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactElement } from "react";

import { BackButton } from "@/components/ui/BackButton";
import { apiClient } from "@/lib/axios";
import { ROUTE_PATHS } from "@/routes/router.const";
import { API_ENDPOINTS } from "@/shared/constants";
import { getOrCreateDeviceId } from "@/utils";

const getSafeRedirect = (value: string | null): string | null => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
};

export default function RegisterPageClient(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeRedirect = getSafeRedirect(searchParams.get("redirect"));
  const loginHref = safeRedirect
    ? `${ROUTE_PATHS.AUTH_ROUTES.LOGIN}?redirect=${encodeURIComponent(
        safeRedirect,
      )}`
    : ROUTE_PATHS.AUTH_ROUTES.LOGIN;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    general: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    if (errors[id as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [id]: "", general: "" }));
    }
  };

  const validate = () => {
    let isValid = true;
    const nextErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      general: "",
    };

    if (!formData.name.trim()) {
      nextErrors.name = "Họ tên là bắt buộc";
      isValid = false;
    }

    if (!formData.email) {
      nextErrors.email = "Email là bắt buộc";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = "Vui lòng nhập email hợp lệ";
      isValid = false;
    }

    if (!formData.password) {
      nextErrors.password = "Mật khẩu là bắt buộc";
      isValid = false;
    } else if (formData.password.length < 6) {
      nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      isValid = false;
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
      isValid = false;
    }

    setErrors(nextErrors);
    return isValid;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const deviceId = getOrCreateDeviceId();
      const name = formData.name.trim();
      const email = formData.email.trim();

      await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        name,
        email,
        password: formData.password,
        deviceId,
      });

      router.replace(loginHref);
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };

      setErrors((prev) => ({
        ...prev,
        general:
          axiosError?.response?.data?.message ??
          (error instanceof Error
            ? error.message
            : "Đăng ký thất bại. Vui lòng thử lại."),
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <BackButton fallbackHref={ROUTE_PATHS.HOME} />
          <Link
            href={ROUTE_PATHS.HOME}
            className="inline-flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-primary"
          >
            <span className="material-symbols-outlined text-[24px]">
              school
            </span>
            AI Study Hub
          </Link>
        </div>

        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm shadow-black/5 sm:p-8">
          <div className="mb-8">
            <p className="font-label-sm text-label-sm uppercase tracking-[0.18em] text-on-surface-variant">
              Đăng ký
            </p>
            <h1 className="mt-2 font-headline-lg text-headline-lg font-bold text-primary">
              Tạo tài khoản mới
            </h1>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {errors.general ? (
              <p className="rounded-xl border border-error/30 bg-error-container px-4 py-3 font-label-sm text-label-sm text-error">
                {errors.general}
              </p>
            ) : null}

            <label className="block">
              <span className="font-label-md text-label-md text-on-surface">
                Họ tên
              </span>
              <input
                id="name"
                value={formData.name}
                onChange={handleChange}
                type="text"
                required
                className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-surface px-4 font-body-md text-body-md outline-none transition-colors focus:border-primary"
                placeholder="Nguyễn Văn A"
              />
              {errors.name ? (
                <span className="mt-1 block text-xs text-error">
                  {errors.name}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="font-label-md text-label-md text-on-surface">
                Email
              </span>
              <input
                id="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                required
                className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-surface px-4 font-body-md text-body-md outline-none transition-colors focus:border-primary"
                placeholder="you@example.com"
              />
              {errors.email ? (
                <span className="mt-1 block text-xs text-error">
                  {errors.email}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="font-label-md text-label-md text-on-surface">
                Mật khẩu
              </span>
              <input
                id="password"
                value={formData.password}
                onChange={handleChange}
                type="password"
                required
                className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-surface px-4 font-body-md text-body-md outline-none transition-colors focus:border-primary"
                placeholder="••••••••"
              />
              {errors.password ? (
                <span className="mt-1 block text-xs text-error">
                  {errors.password}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="font-label-md text-label-md text-on-surface">
                Xác nhận mật khẩu
              </span>
              <input
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                type="password"
                required
                className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-surface px-4 font-body-md text-body-md outline-none transition-colors focus:border-primary"
                placeholder="••••••••"
              />
              {errors.confirmPassword ? (
                <span className="mt-1 block text-xs text-error">
                  {errors.confirmPassword}
                </span>
              ) : null}
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          <p className="mt-5 font-label-sm text-label-sm text-on-surface-variant">
            Đã có tài khoản?{" "}
            <Link
              href={loginHref}
              className="font-medium text-primary hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
