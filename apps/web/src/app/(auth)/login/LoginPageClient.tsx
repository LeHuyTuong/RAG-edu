"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactElement } from "react";

import { BackButton } from "@/components/ui/BackButton";
import { buildUserFromAccessToken, extractAccessToken } from "@/lib/auth";
import { apiClient } from "@/lib/axios";
import {
  buildGoogleLoginUrl,
  completeGoogleLoginFromLocation,
  markGoogleOauthPending,
} from "@/modules/google-auth";
import { ROUTE_PATHS } from "@/routes/router.const";
import { API_ENDPOINTS } from "@/shared/constants";
import { useAuthStore } from "@/stores/auth/store";
import type { UserRole } from "@/types";
import { getOrCreateDeviceId } from "@/utils";
import { getErrorMessage } from "@/utils/error";

const getDefaultRedirectForRole = (role: UserRole): string => {
  if (role === "admin") {
    return ROUTE_PATHS.ADMIN_ROUTES.DASHBOARD;
  }

  if (role === "moderator") {
    return ROUTE_PATHS.MODERATOR_ROUTES.DASHBOARD;
  }

  return ROUTE_PATHS.PROTECTED_ROUTES.HOME;
};

const getSafeRedirect = (value: string | null, role: UserRole): string => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return getDefaultRedirectForRole(role);
  }

  return value;
};

export default function LoginPageClient(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!completeGoogleLoginFromLocation()) {
      return;
    }

    const user = useAuthStore.getState().user;

    router.replace(
      getSafeRedirect(searchParams.get("redirect"), user?.role ?? "student"),
    );
  }, [router, searchParams]);

  const handleGoogleSignin = () => {
    const deviceId = getOrCreateDeviceId();
    const redirectPath = searchParams.get("redirect");
    const oauthState = markGoogleOauthPending();

    window.location.href = buildGoogleLoginUrl({
      deviceId,
      redirectPath,
      oauthState,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const deviceId = getOrCreateDeviceId();
      const data = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
        deviceId,
      });

      const accessToken = extractAccessToken(data);
      const user = buildUserFromAccessToken(accessToken ?? undefined, {
        email,
      });

      if (!accessToken) {
        throw new Error("Login succeeded but access token was missing.");
      }

      if (!user) {
        throw new Error("Login succeeded but token payload was invalid.");
      }

      setAuth(accessToken, user.role, user, null);
      router.replace(getSafeRedirect(searchParams.get("redirect"), user.role));
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, {
          401: "Email hoặc mật khẩu không đúng.",
        }),
      );
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
              Đăng nhập
            </p>
            <h1 className="mt-2 font-headline-lg text-headline-lg font-bold text-primary">
              Chào mừng trở lại
            </h1>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {errorMessage ? (
              <p className="rounded-xl border border-error/30 bg-error-container px-4 py-3 font-label-sm text-label-sm text-error">
                {errorMessage}
              </p>
            ) : null}

            <label className="block">
              <span className="font-label-md text-label-md text-on-surface">
                Email
              </span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-surface px-4 font-body-md text-body-md outline-none transition-colors focus:border-primary"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="font-label-md text-label-md text-on-surface">
                Mật khẩu
              </span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required
                className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-surface px-4 font-body-md text-body-md outline-none transition-colors focus:border-primary"
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-outline-variant" />
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              hoặc
            </span>
            <div className="h-px flex-1 bg-outline-variant" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignin}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface px-5 font-label-lg text-label-lg font-semibold text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="font-bold text-[#EA4335]">G</span>
            Tiếp tục với Google
          </button>

          <Link
            href={ROUTE_PATHS.AUTH_ROUTES.FORGOT_PASSWORD}
            className="mt-5 inline-flex font-label-sm text-label-sm font-medium text-primary hover:underline"
          >
            Quên mật khẩu?
          </Link>

          <p className="mt-5 font-label-sm text-label-sm text-on-surface-variant">
            Chưa có tài khoản?{" "}
            <Link
              href={ROUTE_PATHS.AUTH_ROUTES.REGISTER}
              className="font-medium text-primary hover:underline"
            >
              Đăng ký
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
