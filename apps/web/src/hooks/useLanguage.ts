"use client";

import { useEffect, useState } from "react";

export type Language = "vi" | "en";

const STORAGE_KEY = "ai-study-hub-language";

const LANGUAGE_LABELS: Record<Language, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

export function useLanguage(): {
  language: Language;
  languageLabel: string;
  changeLanguage: (lang: Language) => void;
} {
  const [language, setLanguage] = useState<Language>("vi");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored === "vi" || stored === "en") {
      setLanguage(stored);
      document.documentElement.setAttribute("lang", stored);
    }
  }, []);

  function changeLanguage(lang: Language): void {
    setLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.setAttribute("lang", lang);
  }

  return { language, languageLabel: LANGUAGE_LABELS[language], changeLanguage };
}
