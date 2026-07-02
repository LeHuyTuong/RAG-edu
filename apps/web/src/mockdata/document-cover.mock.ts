export const SUBJECT_THEME_MAP: Record<
  string,
  {
    icon: string;
    gradient: string;
    iconBg: string;
  }
> = {
  "lịch sử": {
    icon: "history_edu",
    gradient: "from-amber-100 via-orange-50 to-red-100",
    iconBg: "bg-amber-500",
  },
  triết: {
    icon: "psychology",
    gradient: "from-violet-100 via-purple-50 to-fuchsia-100",
    iconBg: "bg-violet-500",
  },
  "kinh tế": {
    icon: "payments",
    gradient: "from-emerald-100 via-green-50 to-lime-100",
    iconBg: "bg-emerald-500",
  },
  văn: {
    icon: "menu_book",
    gradient: "from-pink-100 via-rose-50 to-orange-100",
    iconBg: "bg-rose-500",
  },
  toán: {
    icon: "calculate",
    gradient: "from-blue-100 via-sky-50 to-cyan-100",
    iconBg: "bg-blue-500",
  },
  "vật lý": {
    icon: "science",
    gradient: "from-indigo-100 via-blue-50 to-sky-100",
    iconBg: "bg-indigo-500",
  },
  "hóa học": {
    icon: "biotech",
    gradient: "from-yellow-100 via-amber-50 to-orange-100",
    iconBg: "bg-yellow-500",
  },
  "sinh học": {
    icon: "eco",
    gradient: "from-green-100 via-emerald-50 to-teal-100",
    iconBg: "bg-green-500",
  },
  "tiếng anh": {
    icon: "translate",
    gradient: "from-cyan-100 via-sky-50 to-blue-100",
    iconBg: "bg-cyan-500",
  },
  "địa lý": {
    icon: "public",
    gradient: "from-teal-100 via-emerald-50 to-green-100",
    iconBg: "bg-teal-500",
  },
};

export function getSubjectTheme(subjectName?: string | null) {
  if (!subjectName) {
    return {
      icon: "school",
      gradient: "from-slate-100 via-white to-slate-50",
      iconBg: "bg-slate-500",
    };
  }

  const lower = subjectName.toLowerCase().trim();

  for (const [key, theme] of Object.entries(SUBJECT_THEME_MAP)) {
    if (lower.includes(key)) {
      return theme;
    }
  }

  return {
    icon: "school",
    gradient: "from-slate-100 via-white to-slate-50",
    iconBg: "bg-slate-500",
  };
}
