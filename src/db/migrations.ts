/**
 * Database migrations, applied in order, each exactly once.
 * Plain SQLite SQL, so it also works on Cloudflare D1 later.
 * NEVER edit a migration that has shipped; add a new one with the next id.
 */
export const MIGRATIONS: { id: number; sql: string }[] = [
  {
    id: 1,
    sql: `
      CREATE TABLE users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        name          TEXT    NOT NULL,
        password_hash TEXT    NOT NULL,
        role          TEXT    NOT NULL CHECK (role IN ('admin','sales','assistant')),
        locale        TEXT             CHECK (locale IN ('zh-Hant','en')),
        active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
        created_at    TEXT    NOT NULL,
        updated_at    TEXT    NOT NULL
      );

      -- Only a SHA-256 hash of the session token is stored, never the token.
      CREATE TABLE sessions (
        id         TEXT    PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT    NOT NULL,
        created_at TEXT    NOT NULL
      );
      CREATE INDEX sessions_user ON sessions(user_id);

      CREATE TABLE login_failures (
        id    INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL COLLATE NOCASE,
        at    TEXT NOT NULL
      );
      CREATE INDEX login_failures_email_at ON login_failures(email, at);
    `,
  },
];
