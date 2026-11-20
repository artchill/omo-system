import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/db";

const COOKIE = "omo_session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Start a session for a user and set the cookie. */
export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + TTL_MS);
  db()
    .prepare(
      "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    )
    .run(sha256(token), userId, expires.toISOString(), new Date().toISOString());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

/** The user behind the current cookie, or null (missing / expired / disabled). */
export async function readSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const row = db()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.locale
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.id = ? AND s.expires_at > ? AND u.active = 1`,
    )
    .get(sha256(token), new Date().toISOString());
  return (row as unknown as SessionUser | undefined) ?? null;
}

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "sales" | "assistant";
  locale: "zh-Hant" | "en" | null;
};

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db().prepare("DELETE FROM sessions WHERE id = ?").run(sha256(token));
  jar.delete(COOKIE);
}

/** Sign a user out everywhere (used when disabling or resetting a password). */
export function destroyAllSessionsFor(userId: number) {
  db().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

/** Housekeeping: drop expired sessions and old failure records. */
export function purgeExpired() {
  const d = db();
  d.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
  d.prepare("DELETE FROM login_failures WHERE at <= ?").run(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  );
}
