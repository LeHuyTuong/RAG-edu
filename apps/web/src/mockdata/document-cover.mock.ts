export const HISTORY_PERIOD_THEME_MAP: Record<
  string,
  {
    icon: string;
    gradient: string;
    iconBg: string;
  }
> = {
  "kháng chiến chống pháp": {
    icon: "military_tech",
    gradient:
      "from-primary-container/40 via-surface-container-high/50 to-tertiary-container/40",
    iconBg: "bg-primary-container text-on-primary-container",
  },
  "kháng chiến chống mỹ": {
    icon: "flag",
    gradient:
      "from-secondary-container/40 via-surface-container-high/50 to-tertiary-container/40",
    iconBg: "bg-secondary-container text-on-secondary-container",
  },
  "chiến tranh đông dương": {
    icon: "swords",
    gradient:
      "from-tertiary-container/40 via-surface-container-high/50 to-error-container/30",
    iconBg: "bg-tertiary-container text-on-tertiary-container",
  },
  "nhà nguyễn": {
    icon: "account_balance",
    gradient:
      "from-primary-container/40 via-surface-container-high/50 to-secondary-container/40",
    iconBg: "bg-primary-container text-on-primary-container",
  },
  "nhà trần": {
    icon: "castle",
    gradient:
      "from-secondary-container/40 via-surface-container-high/50 to-primary-container/40",
    iconBg: "bg-secondary-container text-on-secondary-container",
  },
  "cách mạng tháng tám": {
    icon: "emoji_flags",
    gradient:
      "from-error-container/30 via-surface-container-high/50 to-primary-container/40",
    iconBg: "bg-error-container text-on-error-container",
  },
  "điện biên phủ": {
    icon: "landslide",
    gradient:
      "from-tertiary-container/40 via-surface-container-high/50 to-primary-container/40",
    iconBg: "bg-tertiary-container text-on-tertiary-container",
  },
  "cải cách ruộng đất": {
    icon: "agriculture",
    gradient:
      "from-primary-container/30 via-surface-container-high/50 to-tertiary-container/40",
    iconBg: "bg-primary-container text-on-primary-container",
  },
  "phong trào cần vương": {
    icon: "diversity_3",
    gradient:
      "from-secondary-container/40 via-surface-container-high/50 to-error-container/30",
    iconBg: "bg-secondary-container text-on-secondary-container",
  },
  "lịch sử": {
    icon: "history_edu",
    gradient:
      "from-primary-container/40 via-surface-container-high/50 to-tertiary-container/40",
    iconBg: "bg-primary-container text-on-primary-container",
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
    return HISTORY_PERIOD_THEME_MAP["lịch sử"]!;
  }

  const lower = subjectName.toLowerCase().trim();

  for (const [key, theme] of Object.entries(HISTORY_PERIOD_THEME_MAP)) {
    if (lower.includes(key)) {
      return theme;
    }
  }

  return HISTORY_PERIOD_THEME_MAP["lịch sử"]!;
}
