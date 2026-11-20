import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { MIGRATIONS } from "../src/db/migrations.ts";

function fresh() {
  const d = new DatabaseSync(":memory:");
  d.exec("PRAGMA foreign_keys = ON");
  for (const m of MIGRATIONS) d.exec(m.sql);
  return d;
}
const t = "2026-01-01T00:00:00Z";
const add = (d: DatabaseSync, email: string, role = "admin") =>
  d
    .prepare(
      "INSERT INTO users (email,name,password_hash,role,created_at,updated_at) VALUES (?,?,?,?,?,?)",
    )
    .run(email, "n", "h", role, t, t);

test("migration ids are unique and ascending", () => {
  const ids = MIGRATIONS.map((m) => m.id);
  assert.deepEqual(ids, [...ids].sort((a, b) => a - b));
  assert.equal(new Set(ids).size, ids.length);
});

test("emails are unique case-insensitively", () => {
  const d = fresh();
  add(d, "A@x.com");
  assert.throws(() => add(d, "a@X.com"));
});

test("role and locale are constrained", () => {
  const d = fresh();
  assert.throws(() => add(d, "b@x.com", "root"));
  add(d, "c@x.com");
  assert.throws(() => d.exec("UPDATE users SET locale='fr'"));
});

test("deleting a user deletes their sessions", () => {
  const d = fresh();
  const id = Number(add(d, "d@x.com").lastInsertRowid);
  d.prepare("INSERT INTO sessions (id,user_id,expires_at,created_at) VALUES ('s',?,?,?)").run(id, t, t);
  d.prepare("DELETE FROM users WHERE id=?").run(id);
  assert.equal(d.prepare("SELECT COUNT(*) n FROM sessions").get()?.n, 0);
});
