/**
 * Global setup for Playwright e2e tests.
 * Registers/logs in test users via the backend API, then stores their auth tokens
 * in a .env file that Playwright test workers can read.
 *
 * Usage:
 *   npx playwright test
 *
 * Environment variables (optional):
 *   E2E_API_URL  – Backend URL (default: http://localhost:8080)
 */

import { FullConfig } from "@playwright/test";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

interface LoginResponse {
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
  accessToken?: string;
}

const API_URL = process.env.E2E_API_URL || "http://localhost:8080";
const AUTH_URL = `${API_URL}/api/v1/auth`;
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD || "changeme";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Test users ───
interface TestUser {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  register?: boolean;
}

export const TEST_USERS: Record<string, TestUser> = {
  user: {
    name: "E2E User",
    email: "e2e-user@test.edu.vn",
    password: E2E_PASSWORD,
    role: "user",
  },
  admin: {
    name: "System Administrator",
    email: "admin@historyrag.edu.vn",
    password: "Admin@123",
    role: "admin",
    register: false,
  },
};

/**
 * Try to register a user. If already registered, try to log in instead.
 * Returns the accessToken if successful, or null.
 */
async function authenticateUser(user: TestUser): Promise<string | null> {
  console.log(`  [setup] Registering ${user.email}...`);

  if (user.register !== false) {
    try {
      const regRes = await axios.post(`${AUTH_URL}/register`, {
        name: user.name,
        email: user.email,
        password: user.password,
        deviceId: "playwright-e2e",
      });
      const token = extractToken(regRes.data);
      if (token) {
        console.log(`  [setup] Registered ${user.email} successfully`);
        return token;
      }
    } catch (err: any) {
      // 409 Conflict = user already exists -> fall through to login
      if (err.response?.status !== 409 && err.response?.status !== 400) {
        console.log(
          `  [setup] Register failed (${err.response?.status}), trying login...`,
        );
      }
    }
  } else {
    console.log(`  [setup] Using existing account ${user.email}...`);
  }

  // Step 2: Try login
  try {
    const loginRes = await axios.post(`${AUTH_URL}/login`, {
      email: user.email,
      password: user.password,
    });
    const token = extractToken(loginRes.data);
    if (token) {
      console.log(`  [setup] Logged in ${user.email} successfully`);
      return token;
    }
  } catch (err: any) {
    console.error(
      `  [setup] Login failed for ${user.email}: ${err.response?.status}`,
    );
  }

  return null;
}

function extractToken(data: any): string | null {
  if (data?.data?.accessToken) return data.data.accessToken;
  if (data?.accessToken) return data.accessToken;
  if (data?.data?.token) return data.data.token;
  return null;
}

async function globalSetup(config: FullConfig) {
  console.log("\n=== Playwright Global Setup ===");
  console.log(`  API URL: ${API_URL}`);
  console.log(
    `  Frontend URL: ${process.env.E2E_BASE_URL || "http://localhost:3000"}\n`,
  );

  const tokens: Record<string, string | null> = {};

  for (const [role, user] of Object.entries(TEST_USERS)) {
    tokens[role] = await authenticateUser(user);
  }

  // Write tokens to a temp file consumed by test workers
  const envPath = path.resolve(__dirname, ".auth-state.json");
  fs.writeFileSync(envPath, JSON.stringify(tokens, null, 2));

  console.log(`\n  Auth state written to ${envPath}`);
  console.log("=== Setup complete ===\n");
}

export default globalSetup;
