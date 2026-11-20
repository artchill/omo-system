import "server-only";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { MIGRATIONS } from "./migrations";

// One connection per server process. Kept on globalThis so dev hot-reload
// doesn't open a new connection on every edit.
const g = globalThis as unknown as { __omoDb?: DatabaseSync };

export function db(): DatabaseSync {
  g.__omoDb ??= open();
  return g.__omoDb;
}

function open(): DatabaseSync {
  const file = resolve(process.env.DATABASE_PATH ?? "data/omo.db");
  mkdirSync(dirname(file), { recursive: true });
  const database = new DatabaseSync(file);
  database.exec(
    "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;",
  );
  migrate(database);
  return database;
}

function migrate(database: DatabaseSync) {
  database.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  const done = new Set(
    database
      .prepare("SELECT id FROM schema_migrations")
      .all()
      .map((row) => Number(row.id)),
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
