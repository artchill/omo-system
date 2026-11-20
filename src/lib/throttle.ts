import "server-only";
import { db } from "@/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export function tooManyFailures(email: string): boolean {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const row = db()
    .prepare("SELECT COUNT(*) AS n FROM login_failures WHERE email = ? AND at > ?")
    .get(email, since);
  return Number(row?.n ?? 0) >= MAX_FAILURES;
}

export function recordFailure(email: string) {
  db()
    .prepare("INSERT INTO login_failures (email, at) VALUES (?, ?)")
    .run(email, new Date().toISOString());
}

export function clearFailures(email: string) {
  db().prepare("DELETE FROM login_failures WHERE email = ?").run(email);
}
