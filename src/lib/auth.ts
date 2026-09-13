import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "crm-for-me-session";
const SESSION_PAYLOAD = "crm-for-me-admin";

function sessionSecret() {
  const secret = process.env.CRM_SESSION_SECRET;
  if (!secret) throw new Error("CRM_SESSION_SECRET is not configured.");
  return secret;
}

function sessionToken() {
  return createHmac("sha256", sessionSecret()).update(SESSION_PAYLOAD).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftHash = createHmac("sha256", sessionSecret()).update(left).digest();
  const rightHash = createHmac("sha256", sessionSecret()).update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function credentialsAreValid(id: string, password: string) {
  const expectedId = process.env.CRM_LOGIN_ID;
  const expectedPassword = process.env.CRM_LOGIN_PASSWORD;
  if (!expectedId || !expectedPassword) return false;
  return safeEqual(id, expectedId) && safeEqual(password, expectedPassword);
}

export async function createSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return Boolean(value && safeEqual(value, sessionToken()));
}

export async function requireAuth() {
  if (!(await isAuthenticated())) redirect("/login");
}
