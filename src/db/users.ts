import "server-only";
import type { Role } from "@/domain/roles";
import type { Locale } from "@/i18n/config";
import { db } from "./index";

export type UserRow = {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  role: Role;
  locale: Locale | null;
  active: number;
  created_at: string;
};

const now = () => new Date().toISOString();

export function countUsers(): number {
  return Number(db().prepare("SELECT COUNT(*) AS n FROM users").get()?.n ?? 0);
}

export function countActiveAdmins(): number {
  return Number(
    db()
      .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1")
      .get()?.n ?? 0,
  );
}

export function findUserByEmail(email: string): UserRow | undefined {
  return db().prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | UserRow
    | undefined;
}

export function findUserById(id: number): UserRow | undefined {
  return db().prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | UserRow
    | undefined;
}

export function listUsers(): UserRow[] {
  return db()
    .prepare("SELECT * FROM users ORDER BY active DESC, name COLLATE NOCASE")
    .all() as unknown as UserRow[];
}

type NewUser = { email: string; name: string; passwordHash: string; role: Role };

export function insertUser(u: NewUser): number {
  const t = now();
  const result = db()
    .prepare(
      `INSERT INTO users (email, name, password_hash, role, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
    )
    .run(u.email, u.name, u.passwordHash, u.role, t, t);
  return Number(result.lastInsertRowid);
}

/** Creates the first admin only if there are no users yet (atomic). */
export function insertFirstAdmin(u: Omit<NewUser, "role">): number | null {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    if (countUsers() > 0) {
      d.exec("ROLLBACK");
      return null;
    }
    const id = insertUser({ ...u, role: "admin" });
    d.exec("COMMIT");
    return id;
  } catch (error) {
    d.exec("ROLLBACK");
    throw error;
  }
}

export function updateUserRoleActive(id: number, role: Role, active: boolean) {
  db()
    .prepare("UPDATE users SET role = ?, active = ?, updated_at = ? WHERE id = ?")
    .run(role, active ? 1 : 0, now(), id);
}

export function updateUserPassword(id: number, passwordHash: string) {
  db()
    .prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
    .run(passwordHash, now(), id);
}

export function updateUserLocale(id: number, locale: Locale) {
  db()
    .prepare("UPDATE users SET locale = ?, updated_at = ? WHERE id = ?")
    .run(locale, now(), id);
}
