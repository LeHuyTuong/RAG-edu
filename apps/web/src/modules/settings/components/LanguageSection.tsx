"use client";

import { Card } from "@/components/ui/Card";
import { useLanguage, type Language } from "@/hooks/useLanguage";

const LANGUAGE_OPTIONS: {
  value: Language;
  label: string;
  sub: string;
  icon: string;
}[] = [
  { value: "vi", label: "Tiếng Việt", sub: "Vietnamese", icon: "flag" },
  { value: "en", label: "English", sub: "Tiếng Anh", icon: "translate" },
];

export function LanguageSection(): React.JSX.Element {
  const { language, changeLanguage } = useLanguage();

  return (
    <Card className="p-6 shadow-sm shadow-black/5 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary">
          language
        </span>
        <div>
          <h2 className="text-lg font-bold text-on-surface">Ngôn ngữ</h2>
          <p className="text-sm text-on-surface-variant">
            Chọn ngôn ngữ hiển thị của ứng dụng.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {LANGUAGE_OPTIONS.map(({ value, label, sub, icon }) => {
          const selected = language === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => changeLanguage(value)}
              className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-outline-variant bg-surface hover:border-primary/50 hover:bg-surface-container-high"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[28px] ${
                  selected ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {icon}
              </span>
              <div className="flex-1">
                <p
                  className={`font-label-md text-label-md tracking-normal ${
                    selected ? "text-primary" : "text-on-surface"
                  }`}
                >
                  {label}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {sub}
                </p>
              </div>
              {selected ? (
                <span className="material-symbols-outlined text-[20px] text-primary">
                  check_circle
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="mt-4 rounded-lg bg-surface-container-low px-4 py-3 font-label-sm text-label-sm text-on-surface-variant">
        Hỗ trợ đa ngôn ngữ đầy đủ sẽ được bổ sung trong phiên bản sắp tới.
      </p>
    </Card>
  );
}
