"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { buildUserFromAccessToken, extractAccessToken } from "@/lib/auth";
import { apiClient } from "@/lib/axios";
import {
  buildGoogleLoginUrl,
  markGoogleOauthPending,
} from "@/modules/google-auth";
import { ROUTE_PATHS } from "@/routes/router.const";
import { API_ENDPOINTS } from "@/shared/constants";
import { useAuthStore } from "@/stores/auth/store";
import { getOrCreateDeviceId } from "@/utils";
import { getErrorMessage } from "@/utils/error";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  onOpenRegister,
}: LoginModalProps): ReactElement | null {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const resetForm = () => {
    setFormData({ email: "", password: "" });
    setErrors({ email: "", password: "", general: "" });
    setShowPassword(false);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [id]: "", general: "" }));
    }
  };

  const validate = () => {
    let isValid = true;
    const newErrors = { email: "", password: "", general: "" };

    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    setIsLoading(true);
    try {
      const deviceId = getOrCreateDeviceId();

      const data = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: formData.email,
        password: formData.password,
        deviceId,
      });

      const accessToken = extractAccessToken(data);
      const user = buildUserFromAccessToken(accessToken ?? undefined, {
        email: formData.email,
      });

      if (!accessToken || !user) {
        // Logged for debugging — never shown to the user as-is.
        console.error(
          "Login response missing access token or invalid payload:",
          data,
        );
        setErrors((prev) => ({
          ...prev,
          general: "Đăng nhập thất bại. Vui lòng thử lại.",
        }));
        return;
      }

      setAuth(accessToken, user.role, user, null);
      resetForm();
      onClose();
      router.push(ROUTE_PATHS.PROTECTED_ROUTES.HOME);
    } catch (error: unknown) {
      // Logged for debugging — the user only ever sees a mapped message.
      console.error("Login failed:", error);
      setErrors((prev) => ({
        ...prev,
        general: getErrorMessage(error, {
          401: "Email hoặc mật khẩu không đúng.",
        }),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      resetForm();
      onClose();
    }
  };

  const handleGoogleSignin = () => {
    const deviceId = getOrCreateDeviceId();
    const oauthState = markGoogleOauthPending();

    window.location.href = buildGoogleLoginUrl({
      deviceId,
      oauthState,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="flex min-h-full items-center justify-center">
        <div className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white p-8 shadow-2xl shadow-slate-950/20">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            aria-label="Close login modal"
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-blue-600 mb-6">
            AI Study Hub
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-center text-gray-600 text-sm mb-8">
            Please login to continue learning and sharing.
          </p>

          <form
            className="flex flex-col gap-5"
            onSubmit={handleSubmit}
            noValidate
          >
            {errors.general && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                {errors.general}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-bold text-gray-900"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                className={`w-full h-12 px-4 bg-gray-100 border rounded text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all ${errors.email ? "border-red-600" : "border-gray-300"}`}
                placeholder="example@academic.edu"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <span className="text-red-600 text-xs mt-1">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <label
                  htmlFor="password"
                  className="text-sm font-bold text-gray-900"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`w-full h-12 px-4 pr-12 bg-gray-100 border rounded text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all ${errors.password ? "border-red-600" : "border-gray-300"}`}
                  placeholder="••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "👁" : "🙈"}
                </button>
              </div>
              {errors.password && (
                <span className="text-red-600 text-xs mt-1">
                  {errors.password}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base bg-[#004ac6] hover:bg-[#2c5b9e] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-full transition-colors"
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-semibold text-gray-500">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignin}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50"
          >
            <span className="font-bold text-[#EA4335]">G</span>
            Continue with Google
          </button>

          <p className="text-center text-gray-600 text-sm mt-6">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => {
                resetForm();
                onClose();
                onOpenRegister();
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
