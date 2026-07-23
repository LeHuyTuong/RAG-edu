import type { User } from "@/types";

import type { CurrentAccount } from "../types";

function normalizeUserRole(role?: string): User["role"] {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return "admin";
    case "MODERATOR":
      return "moderator";
    case "TEACHER":
      return "teacher";
    case "USER":
    case "STUDENT":
      return "student";
    default:
      return "guest";
  }
}

export function mapCurrentAccount(account: CurrentAccount): User {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    role: normalizeUserRole(account.role),
    status: account.status,
    avatar: account.avatarUrl || undefined,
    createdAt: new Date(account.createdAt),
  };
}
