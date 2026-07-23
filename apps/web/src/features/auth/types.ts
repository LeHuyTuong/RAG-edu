import type { User, UserRole } from "@/types";

export type { User, UserRole };

export interface SignInPayload {
  readonly email: string;
  readonly password: string;
  readonly deviceId: string;
}

export interface SignUpPayload {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly deviceId: string;
}

export interface SignInResponse {
  readonly accessToken: string;
}

export interface CurrentAccount {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl?: string | null;
  readonly role: string;
  readonly status: string;
  readonly createdAt: string;
}
