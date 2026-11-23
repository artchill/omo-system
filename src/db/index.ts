import "server-only";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import type BetterSqlite3 from "better-sqlite3";
import { MIGRATIONS } from "./migrations";

// One connection per server process. Kept on globalThis so dev hot-reload
// doesn't open a new connection on every edit.
const g = globalThis as unknown as { __omoDb?: BetterSqlite3.Database };

export function db(): BetterSqlite3.Database {
  g.__omoDb ??= open();
  return g.__omoDb;
}

function open(): BetterSqlite3.Database {
  const file = resolve(process.env.DATABASE_PATH ?? "data/omo.db");
  mkdirSync(dirname(file), { recursive: true });
  const database = new Database(file);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  migrate(database);
  return database;
}

function migrate(database: BetterSqlite3.Database) {
  database.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  const done = new Set(
    database
      .prepare("SELECT id FROM schema_migrations")
      .all()
      .map((row) => Number((row as { id: number }).id)),
  );
  for (const m of MIGRATIONS) {
    if (done.has(m.id)) continue;
    database.exec("BEGIN");
    try {
      database.exec(m.sql);
      database
        .prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)")
        .run(m.id, new Date().toISOString());
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }
}
