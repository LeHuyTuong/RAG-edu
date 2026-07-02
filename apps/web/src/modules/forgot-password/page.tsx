"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { ROUTE_PATHS } from "@/routes/router.const";

/**
 * Backend hiện chưa hỗ trợ forgot-password (không có endpoint tương ứng),
 * nên trang này chuyển hướng thẳng về đăng nhập thay vì gọi API không tồn tại.
 */
export default function ForgotPasswordPage(): ReactElement | null {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTE_PATHS.AUTH_ROUTES.LOGIN);
  }, [router]);

  return null;
}
