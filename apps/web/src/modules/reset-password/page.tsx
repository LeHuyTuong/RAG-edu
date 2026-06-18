"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactElement } from "react";
import { Button } from "@repo/ui/button";
import { BackButton } from "@/components/ui/BackButton";
import { resetPassword } from "../auth-api";

export default function ResetPasswordPage(): ReactElement {
  const params = useParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({ password: "", confirmPassword: "" });
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const validate = () => {
    let isValid = true;
    const nextErrors = { password: "", confirmPassword: "" };

    if (!formData.password) {
      nextErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(nextErrors);
    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setApiError("Invalid password reset link.");
      return;
    }

    if (validate()) {
      setApiError("");
      setIsSubmitting(true);
      try {
        await resetPassword({
          token,
          password: formData.password,
        });
        setFormData({ password: "", confirmPassword: "" });
        setSubmitted(true);
      } catch (error) {
        setApiError(
          error instanceof Error ? error.message : "Could not reset password",
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!token && !submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md bg-white rounded-lg shadow p-12 flex flex-col gap-6">
            <BackButton
              fallbackHref="/forgot-password"
              className="self-start"
            />
            <h1 className="text-2xl font-bold text-center text-gray-900">
              Reset password
            </h1>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Invalid password reset link.
            </div>
            <Link
              href="/forgot-password"
              className="inline-flex h-12 w-full items-center justify-center rounded bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Request new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-12 flex flex-col">
          <BackButton
            fallbackHref="/forgot-password"
            className="mb-6 self-start"
          />

          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-blue-600 mb-6">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 10V7C4 5.34315 5.34315 4 7 4H17C18.6569 4 20 5.34315 20 7V10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 14V20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 17H15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            AI Study Hub
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Reset password
          </h1>
          <p className="text-center text-gray-600 text-sm mb-8">
            Choose a new password for your account.
          </p>

          {submitted ? (
            <div className="flex flex-col gap-6">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                Your password was updated successfully.
              </div>

              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center rounded bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Continue to sign in
              </Link>
            </div>
          ) : (
            <form
              className="flex flex-col gap-5"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="password"
                  className="text-sm font-bold text-gray-900"
                >
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  className={`w-full h-12 px-4 bg-gray-100 border rounded text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all ${
                    errors.password ? "border-red-600" : "border-gray-300"
                  }`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password ? (
                  <span className="text-red-600 text-xs mt-1">
                    {errors.password}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-bold text-gray-900"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className={`w-full h-12 px-4 bg-gray-100 border rounded text-gray-900 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all ${
                    errors.confirmPassword
                      ? "border-red-600"
                      : "border-gray-300"
                  }`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword ? (
                  <span className="text-red-600 text-xs mt-1">
                    {errors.confirmPassword}
                  </span>
                ) : null}
              </div>

              {apiError ? (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {apiError}
                </div>
              ) : null}

              <Button
                appName="web"
                type="submit"
                className="w-full h-12 bg-blue-600 text-white font-semibold hover:bg-blue-700 rounded mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update password"}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Need a new link?{" "}
                <Link
                  href="/forgot-password"
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Request new link
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
