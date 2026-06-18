export type AdminNavSection = "dashboard" | "users" | "settings";

export type AdminTone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "error"
  | "neutral";

export interface AdminStat {
  readonly label: string;
  readonly value: string;
  readonly caption: string;
  readonly icon: string;
  readonly tone: AdminTone;
  readonly trend: string;
}

export interface AdminActivityPoint {
  readonly label: string;
  readonly users: number;
  readonly sessions: number;
  readonly transactions: number;
}

export interface AdminActivity {
  readonly id: string;
  readonly action: string;
  readonly performer: string;
  readonly timestamp: string;
  readonly details: string;
  readonly tone: Exclude<AdminTone, "neutral">;
}

export interface SystemServiceStatus {
  readonly name: string;
  readonly status: "operational" | "degraded" | "maintenance";
  readonly uptime: string;
  readonly latency: string;
}

export type AdminUserRole = "ADMIN" | "MODERATOR" | "USER";
export type AdminUserStatus = "UNVERIFIED" | "ACTIVE" | "BANNED" | "DELETED";

export interface AdminUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl?: string | null;
  readonly role: AdminUserRole;
  readonly status: AdminUserStatus;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly lastLogin: string;
}

export interface AdminSettings {
  readonly general: {
    readonly systemName: string;
    readonly systemLogo: string;
    readonly systemDescription: string;
    readonly timezone: string;
  };
  readonly security: {
    readonly passwordMinLength: number;
    readonly passwordExpiry: number;
    readonly twoFAEnabled: boolean;
    readonly sessionTimeout: number;
  };
  readonly email: {
    readonly smtpServer: string;
    readonly smtpPort: number;
    readonly senderEmail: string;
    readonly senderName: string;
  };
  readonly notifications: {
    readonly emailAlerts: boolean;
    readonly systemAlerts: boolean;
    readonly alertFrequency: string;
  };
}
