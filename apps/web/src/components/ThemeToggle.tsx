"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useThemeStore } from "@/stores";

/**
 * Nút bật/tắt Dark Mode được tối ưu hóa.
 * Đồng bộ hóa giao diện tức thì qua CSS để tránh lỗi Hydration Mismatch
 * và không gây ra hiện tượng xoay icon (animate-spin) khi tải lại trang (F5).
 */
export function ThemeToggle(): React.JSX.Element {
  const { toggleTheme } = useThemeStore();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Chuyển đổi giao diện sáng/tối"
      className="relative size-8 flex items-center justify-center"
    >
      <div className="relative size-5 flex items-center justify-center overflow-hidden">
        {/* Sun visible in light mode */}
        <Sun className="theme-toggle-sun absolute size-5" />
        {/* Moon visible in dark mode */}
        <Moon className="theme-toggle-moon absolute size-5" />
        {/* Laptop visible in system mode */}
        <Laptop className="theme-toggle-laptop absolute size-5" />
      </div>
    </Button>
  );
}
