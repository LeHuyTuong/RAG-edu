"use client";

/**
 * SecurityForm
 *
 * Password-change section.
 *
 * Calls the authenticated POST /api/v1/auth/change-password endpoint.
 *
 * The "Hủy bỏ" button resets all password fields to empty.
 * The "Lưu thay đổi" button submits the form.
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InputField } from "@/components/ui/InputField";
import { changePassword } from "@/modules/auth-api";

// ── Validation schema ─────────────────────────────────────────────────────────

const schema = z
  .object({
    currentPassword: z
      .string()
      .trim()
      .min(8, "Mật khẩu hiện tại phải có ít nhất 8 ký tự"),
    newPassword: z
      .string()
      .trim()
      .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
    confirmPassword: z.string().trim().min(8, "Vui lòng nhập lại mật khẩu mới"),
  })
  .refine(
    ({ newPassword, confirmPassword }) => newPassword === confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Mật khẩu xác nhận không khớp",
    },
  );

type FormValues = z.infer<typeof schema>;

// ── Component ─────────────────────────────────────────────────────────────────

export function SecurityForm(): React.JSX.Element {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Show/hide password toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setStatusMessage("Cập nhật mật khẩu thành công.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật mật khẩu. Vui lòng thử lại.",
      );
    }
  });

  const handleCancel = () => {
    reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setStatusMessage(null);
    setErrorMessage(null);
  };

  return (
    <Card className="p-6 shadow-sm shadow-black/5 lg:p-8">
      {/* Section header */}
      <div className="mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary">lock</span>
        <div>
          <h2 className="text-lg font-bold text-on-surface">Bảo mật</h2>
          <p className="text-sm text-on-surface-variant">
            Đặt mật khẩu mới cho tài khoản của bạn.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 md:grid-cols-3">
          {/* Current password */}
          <Controller
            name="currentPassword"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                label="Mật khẩu hiện tại"
                placeholder="••••••••"
                type={showCurrent ? "text" : "password"}
                errorText={errors.currentPassword?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="text-on-surface-variant"
                    aria-label={
                      showCurrent
                        ? "Ẩn mật khẩu hiện tại"
                        : "Hiện mật khẩu hiện tại"
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showCurrent ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                }
              />
            )}
          />

          {/* New password */}
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                label="Mật khẩu mới"
                placeholder="••••••••"
                type={showNew ? "text" : "password"}
                errorText={errors.newPassword?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="text-on-surface-variant"
                    aria-label={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showNew ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                }
              />
            )}
          />

          {/* Confirm password */}
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                label="Xác nhận mật khẩu"
                placeholder="••••••••"
                type={showConfirm ? "text" : "password"}
                errorText={errors.confirmPassword?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="text-on-surface-variant"
                    aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirm ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                }
              />
            )}
          />
        </div>

        {/* Status message */}
        {statusMessage ? (
          <p className="rounded-xl bg-secondary-container px-4 py-3 text-sm text-on-secondary-container">
            {statusMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="rounded-xl bg-error-container px-4 py-3 text-sm text-error">
            {errorMessage}
          </p>
        ) : null}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={!isDirty}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? "Đang cập nhật..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
