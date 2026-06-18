"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CircleX, Home, LoaderCircle, LogIn, X } from "lucide-react";
import type { ReactElement } from "react";
import { buildUserFromAccessToken, extractAccessToken } from "@/lib/auth";
import { verifyEmail } from "@/modules/auth-api";
import { useAuthStore } from "@/stores/auth/store";
import { getOrCreateDeviceId } from "@/utils";

type VerifyEmailPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default function VerifyEmailPage({
  params,
}: VerifyEmailPageProps): ReactElement {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Đang xác thực email của bạn...");
  const setAuth = useAuthStore((state) => state.setAuth);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  useEffect(() => {
    let isMounted = true;

    params
      .then(({ token: nextToken }) => {
        if (isMounted) setToken(nextToken);
      })
      .catch(() => {
        if (!isMounted) return;
        setState("error");
        setMessage("Invalid verification link.");
      });

    return () => {
      isMounted = false;
    };
  }, [params]);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    verifyEmail({
      token,
      deviceId: getOrCreateDeviceId(),
      deviceType: "WEB",
    })
      .then((response) => {
        if (!isMounted) return;

        const accessToken = extractAccessToken(response.data);
        const currentUser = useAuthStore.getState().user;
        const user = buildUserFromAccessToken(accessToken ?? undefined, {
          email: currentUser?.email,
          name: currentUser?.name,
        });

        if (accessToken && user) {
          setAuth(accessToken, user.role, user, null);
        } else if (accessToken) {
          setAccessToken(accessToken);
        }

        setState("success");
        setMessage(
          response.message ??
            "Email của bạn đã được xác thực. Bạn có thể đóng màn hình này hoặc quay về trang chủ để tiếp tục.",
        );
      })
      .catch((error) => {
        if (!isMounted) return;
        setState("error");
        setMessage(
          error instanceof Error ? error.message : "Email verification failed.",
        );
      });

    return () => {
      isMounted = false;
    };
  }, [setAccessToken, setAuth, token]);

  const isSuccess = state === "success";
  const isError = state === "error";

  const handleClose = () => {
    router.replace("/home");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-10 text-slate-950">
      <button
        type="button"
        aria-label="Quay về trang chủ"
        onClick={handleClose}
        className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#f5f7fb]"
      >
        <X size={20} aria-hidden="true" />
      </button>

      <section className="w-full max-w-[448px] rounded-2xl border border-slate-200 bg-white px-10 py-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:px-11">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
          AI Study Hub
        </p>

        <div
          className={`mx-auto mt-7 flex h-20 w-20 items-center justify-center rounded-full ${
            isSuccess
              ? "bg-emerald-100 text-white ring-[7px] ring-emerald-50"
              : isError
                ? "bg-red-100 text-red-600 ring-[7px] ring-red-50"
                : "bg-blue-100 text-blue-600 ring-[7px] ring-blue-50"
          }`}
        >
          {isError ? (
            <CircleX size={36} aria-hidden="true" />
          ) : state === "loading" ? (
            <LoaderCircle
              size={34}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
              <Check size={32} strokeWidth={3} aria-hidden="true" />
            </span>
          )}
        </div>

        <h1 className="mt-8 text-2xl font-bold leading-tight text-slate-950">
          {isSuccess
            ? "Xác thực email thành công"
            : isError
              ? "Xác thực email thất bại"
              : "Đang xác thực email"}
        </h1>
        <p className="mx-auto mt-3 max-w-[330px] text-sm leading-6 text-slate-500">
          {isSuccess
            ? "Email của bạn đã được xác thực. Bạn có thể đóng màn hình này hoặc quay về trang chủ để tiếp tục."
            : message}
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/home"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Home size={17} aria-hidden="true" />
            Về trang chủ
          </Link>

          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <LogIn size={17} aria-hidden="true" />
            Đăng nhập ngay
          </Link>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="mt-6 inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Đóng màn hình
        </button>
      </section>
    </main>
  );
}
