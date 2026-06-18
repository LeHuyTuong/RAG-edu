"use client";

/**
 * PersonalInfoForm
 *
 * Displays and edits the user's personal information.
 *
 * API behaviour:
 *  - On save, uploads the selected avatar file to Cloudinary if changed,
 *    and calls PATCH /api/v1/accounts/:id with { name, avatarUrl? }.
 *  - "Trường đại học", "Khoa", "Chuyên ngành" are marked read-only with a message
 *    "(Tính năng đang phát triển)" as they are not yet supported by the backend.
 *
 * Auth store update:
 *  After a successful save, updates the store's user state immediately so
 *  the SideNav and other surfaces reflect the change without a page reload.
 */

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InputField } from "@/components/ui/InputField";

import { updateProfile } from "@/apis/account.api";
import { useAuthStore } from "@/stores/auth/store";
import { DEFAULT_AVATAR_URL, isDefaultAvatar } from "@/shared/constants";
import type { User } from "@/types";
import { toast } from "sonner";

// ── Validation schema ─────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().trim().min(1, "Họ tên không được để trống"),
  university: z.string().trim(),
  faculty: z.string().trim(),
  major: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

// ── Constants ─────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Derive up-to-2-character initials from a display name. */
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Helper to upload image to Cloudinary */
async function uploadAvatarToCloudinary(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cấu hình lưu trữ ảnh (Cloudinary) bị thiếu. Vui lòng liên hệ quản trị viên.",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );

  if (!cloudRes.ok) {
    throw new Error("Lỗi kết nối máy chủ Cloudinary khi tải ảnh lên.");
  }

  const cloudData = await cloudRes.json();
  if (!cloudData || typeof cloudData.secure_url !== "string") {
    throw new Error("Dữ liệu phản hồi từ máy chủ Cloudinary không hợp lệ.");
  }

  return cloudData.secure_url;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  /** Authenticated user object from the auth store. */
  readonly user: User;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PersonalInfoForm({ user }: Props): React.JSX.Element {
  const setUser = useAuthStore((state) => state.setUser);

  // ── States ──────────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // ── Avatar States ───────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatar ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isAvatarDeleted, setIsAvatarDeleted] = useState(false);

  // ── React Hook Form ──────────────────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name,
      university: "",
      faculty: "",
      major: "",
    },
  });

  // Watch current name for live initials preview
  const formName = useWatch({ control, name: "name" }) || user.name;
  const initials = useMemo(() => getInitials(formName), [formName]);

  // Clean up Object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Sync avatarPreview when user.avatar changes from outside (if not editing)
  useEffect(() => {
    if (!isEditing) {
      setAvatarPreview(user.avatar ?? "");
    }
  }, [user.avatar, isEditing]);

  const hasExistingAvatar = useMemo(() => {
    return !!(user.avatar && !isDefaultAvatar(user.avatar));
  }, [user.avatar]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const resetFormStateFromUser = useCallback(() => {
    reset({ name: user.name, university: "", faculty: "", major: "" });
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(user.avatar ?? "");
    setAvatarFile(null);
    setIsAvatarDeleted(false);
    setStatusMessage(null);
    setIsError(false);
  }, [user, reset, avatarPreview]);

  const beginEditing = () => {
    resetFormStateFromUser();
    setIsEditing(true);
  };

  const cancelEditing = () => {
    resetFormStateFromUser();
    setIsEditing(false);
    setStatusMessage("Đã hủy chỉnh sửa hồ sơ.");
    setIsError(false);
    toast.info("Đã hủy chỉnh sửa hồ sơ.");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const isTypeAllowed = ALLOWED_TYPES.includes(file.type);
    const isExtAllowed = fileExt ? ALLOWED_EXTENSIONS.includes(fileExt) : false;

    if (!isTypeAllowed && !isExtAllowed) {
      const msg = "Chỉ chấp nhận ảnh định dạng JPG, JPEG, PNG, GIF hoặc WEBP.";
      setStatusMessage(msg);
      setIsError(true);
      toast.error(msg);
      e.target.value = "";
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      const msg = "Kích thước ảnh không được vượt quá 2MB.";
      setStatusMessage(msg);
      setIsError(true);
      toast.error(msg);
      e.target.value = "";
      return;
    }

    // Revoke old blob preview URL if any
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(previewUrl);
    setIsAvatarDeleted(false);
    setStatusMessage(null);
    setIsError(false);

    // Reset input value so the same file can be selected again
    e.target.value = "";
  };

  const handleDeleteAvatar = () => {
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview("");
    setAvatarFile(null);
    setIsAvatarDeleted(true);
    setStatusMessage(null);
    setIsError(false);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      let finalAvatarUrl: string | undefined = undefined;

      if (isAvatarDeleted) {
        finalAvatarUrl = DEFAULT_AVATAR_URL;
      } else if (avatarFile) {
        // Upload image to Cloudinary using extracted helper
        finalAvatarUrl = await uploadAvatarToCloudinary(avatarFile);
      }

      // Restful PATCH: only send avatarUrl if it was changed
      const updatePayload: { name: string; avatarUrl?: string } = {
        name: values.name,
      };

      if (finalAvatarUrl !== undefined) {
        updatePayload.avatarUrl = finalAvatarUrl;
      }

      // Persist name and/or avatarUrl to the API
      const response = await updateProfile(user.id, updatePayload);

      // Update the auth store so other components update instantly
      setUser({
        ...user,
        name: response.name,
        avatar: response.avatarUrl || undefined,
      });

      setAvatarFile(null);
      setIsAvatarDeleted(false);
      setIsEditing(false);
      const successMsg = "Cập nhật hồ sơ thành công.";
      setStatusMessage(successMsg);
      setIsError(false);
      toast.success(successMsg);
    } catch (err) {
      console.error("[PersonalInfoForm] Update profile failed:", err);
      setIsError(true);
      const errMsg =
        err instanceof Error
          ? err.message
          : "Cập nhật hồ sơ thất bại. Vui lòng thử lại sau.";
      setStatusMessage(errMsg);
      toast.error(errMsg);
    }
  });

  const isFormChanged = isDirty || avatarFile !== null || isAvatarDeleted;
  const readonlyCls = "bg-surface-container-low text-on-surface-variant";

  return (
    <Card className="p-6 shadow-sm shadow-black/5 lg:p-8">
      {/* ── Section header ── */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-on-surface">Thông tin cá nhân</h2>

        {/* Toggle edit / save actions */}
        {!isEditing ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={beginEditing}
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                edit
              </span>
              Chỉnh sửa
            </span>
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={cancelEditing}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              form="personal-info-form"
              variant="primary"
              size="sm"
              disabled={isSubmitting || !isFormChanged}
            >
              {isSubmitting ? "Đang lưu..." : "Lưu hồ sơ"}
            </Button>
          </div>
        )}
      </div>

      {/* ── Avatar row ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar
          imageUrl={avatarPreview}
          initials={initials}
          size="lg"
          className="h-20 w-20 shrink-0 border-4 border-surface-container object-cover"
        />
        <div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!isEditing}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">
                  upload
                </span>
                Tải ảnh mới
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!isEditing || !hasExistingAvatar}
              className="text-error hover:bg-error-container hover:text-error"
              onClick={handleDeleteAvatar}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">
                  delete
                </span>
                Xóa ảnh
              </span>
            </Button>
          </div>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp"
            className="sr-only"
            onChange={handleAvatarChange}
          />
          <p className="mt-1.5 text-xs text-on-surface-variant">
            Chấp nhận JPG, JPEG, PNG, GIF hoặc WEBP. Kích thước tối đa 2MB.
          </p>
        </div>
      </div>

      {/* ── Form ── */}
      <form id="personal-info-form" onSubmit={onSubmit} noValidate>
        <div className="grid gap-5 md:grid-cols-2">
          {/* Name — persisted to API */}
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                label="Họ tên"
                placeholder="Nhập họ tên của bạn"
                disabled={!isEditing}
                errorText={errors.name?.message}
                className={!isEditing ? readonlyCls : ""}
              />
            )}
          />

          {/* Email — read-only; cannot be changed from this form */}
          <InputField
            label="Email"
            value={user.email}
            disabled
            className={readonlyCls}
            helperText="Email không thể chỉnh sửa từ trang này"
          />

          {/* University — disabled with feature warning (API does not support this field yet) */}
          <Controller
            name="university"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                label="Trường đại học (Tính năng đang phát triển)"
                placeholder="Tên trường đại học"
                disabled
                className={readonlyCls}
                errorText={errors.university?.message}
                helperText="Tính năng đang được phát triển"
              />
            )}
          />

          {/* Faculty — disabled with feature warning */}
          <Controller
            name="faculty"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                label="Khoa (Tính năng đang phát triển)"
                placeholder="Khoa của bạn"
                disabled
                className={readonlyCls}
                errorText={errors.faculty?.message}
                helperText="Tính năng đang được phát triển"
              />
            )}
          />

          {/* Major — disabled with feature warning */}
          <Controller
            name="major"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                label="Chuyên ngành (Tính năng đang phát triển)"
                placeholder="Chuyên ngành học"
                disabled
                className={readonlyCls}
                errorText={errors.major?.message}
                helperText="Tính năng đang được phát triển"
              />
            )}
          />
        </div>
      </form>

      {/* Status message (semantic style & role for accessibility) */}
      {statusMessage ? (
        <div
          role={isError ? "alert" : "status"}
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
            isError
              ? "bg-error-container text-error border border-error/20"
              : "bg-primary/10 text-primary border border-primary/20"
          }`}
        >
          {statusMessage}
        </div>
      ) : null}
    </Card>
  );
}
