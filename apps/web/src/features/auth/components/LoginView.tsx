"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactElement } from "react";

import { BackButton } from "@/components/ui/BackButton";
import { useLogin } from "@/features/auth";
import { ROUTE_PATHS } from "@/routes/router.const";
import { getErrorMessage } from "@/utils/error";

import { getSafeRedirect } from "../lib/auth.redirect";

export function LoginView(): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (login.isPending) {
      return;
    }

    setErrorMessage("");

    try {
      const user = await login.mutateAsync({ email, password });
      router.replace(getSafeRedirect(searchParams.get("redirect"), user.role));
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, {
          401: "Email hoặc mật khẩu không đúng.",
        }),
      );
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
              disabled={login.isPending}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {login.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-6 text-center font-label-sm text-label-sm text-on-surface-variant">
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
