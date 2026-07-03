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
    gradient:
      "from-primary-container/40 via-surface-container-high/50 to-tertiary-container/40",
    iconBg: "bg-primary-container text-on-primary-container",
  },
  triết: {
    icon: "psychology",
    gradient:
      "from-secondary-container/40 via-surface-container-high/50 to-tertiary-container/40",
    iconBg: "bg-secondary-container text-on-secondary-container",
  },
  "kinh tế": {
    icon: "payments",
    gradient:
      "from-tertiary-container/40 via-surface-container-high/50 to-primary-container/40",
    iconBg: "bg-tertiary-container text-on-tertiary-container",
  },
  văn: {
    icon: "menu_book",
    gradient:
      "from-error-container/30 via-surface-container-high/50 to-primary-container/40",
    iconBg: "bg-error-container text-on-error-container",
  },
  toán: {
    icon: "calculate",
    gradient:
      "from-primary-container/40 via-surface-container-high/50 to-secondary-container/40",
    iconBg: "bg-primary-container text-on-primary-container",
  },
  "vật lý": {
    icon: "science",
    gradient:
      "from-secondary-container/40 via-surface-container-high/50 to-primary-container/40",
    iconBg: "bg-secondary-container text-on-secondary-container",
  },
  "hóa học": {
    icon: "biotech",
    gradient:
      "from-tertiary-container/40 via-surface-container-high/50 to-error-container/30",
    iconBg: "bg-tertiary-container text-on-tertiary-container",
  },
  "sinh học": {
    icon: "eco",
    gradient:
      "from-primary-container/30 via-surface-container-high/50 to-tertiary-container/40",
    iconBg: "bg-primary-container text-on-primary-container",
  },
  "tiếng anh": {
    icon: "translate",
    gradient:
      "from-secondary-container/40 via-surface-container-high/50 to-tertiary-container/40",
    iconBg: "bg-secondary-container text-on-secondary-container",
  },
  "địa lý": {
    icon: "public",
    gradient:
      "from-tertiary-container/40 via-surface-container-high/50 to-primary-container/40",
    iconBg: "bg-tertiary-container text-on-tertiary-container",
  },
};

export function getSubjectTheme(subjectName?: string | null) {
  if (!subjectName) {
    return {
      icon: "school",
      gradient:
        "from-surface-container-high via-surface to-surface-container-high",
      iconBg: "bg-surface-container-high text-on-surface-variant",
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
    gradient:
      "from-surface-container-high via-surface to-surface-container-high",
    iconBg: "bg-surface-container-high text-on-surface-variant",
  };
}
