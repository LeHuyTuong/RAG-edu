"use client";

import { Card } from "@/components/ui/Card";
import { useTheme } from "@/hooks/useTheme";

export function ThemeSection(): React.JSX.Element {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="p-6 shadow-sm shadow-black/5 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary">
          contrast
        </span>
        <div>
          <h2 className="text-lg font-bold text-on-surface">Giao diện</h2>
          <p className="text-sm text-on-surface-variant">
            Chọn chế độ hiển thị ưa thích.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Segmented Control */}
        <div className="grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/50">
          {(["light", "dark", "system"] as const).map((mode) => {
            const isActive = theme === mode;
            let label = "";
            let iconName = "";
            if (mode === "light") {
              label = "Sáng";
              iconName = "light_mode";
            } else if (mode === "dark") {
              label = "Tối";
              iconName = "dark_mode";
            } else {
              label = "Hệ thống";
              iconName = "desktop_windows";
            }

            return (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm scale-[1.01]"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {iconName}
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Current theme status display */}
        <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface p-4">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <span className="material-symbols-outlined text-[20px]">
              {theme === "dark"
                ? "dark_mode"
                : theme === "light"
                  ? "light_mode"
                  : "desktop_windows"}
            </span>
          </span>
          <div>
            <p className="font-label-md text-label-md tracking-normal">
              {theme === "dark"
                ? "Chế độ tối"
                : theme === "light"
                  ? "Chế độ sáng"
                  : "Đồng bộ hệ thống"}
            </p>
            <p className="font-label-sm text-label-sm tracking-normal text-on-surface-variant">
              Hiện đang được chọn làm giao diện chính
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
