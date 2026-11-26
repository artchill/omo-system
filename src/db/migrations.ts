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
  {
    id: 2,
    sql: `
      -- Lead sources (e.g. 官網, FB廣告, 轉介). Managed by admin.
      CREATE TABLE sources (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        name    TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        grade   TEXT    NOT NULL DEFAULT '',
        active  INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
        sort    INTEGER NOT NULL DEFAULT 0
      );

      -- Seed default sources from the data dictionary
      INSERT INTO sources (name, grade, sort) VALUES
        ('官網',       'A', 1),
        ('社群',       'A', 2),
        ('電話進線',   'A', 3),
        ('FB廣告',     'C', 4),
        ('庫存名單',   '庫', 5),
        ('部落客',     '',  6),
        ('轉介',       'B', 7),
        ('線上轉介',   'B', 8),
        ('線上轉線下', '轉', 9),
        ('續約',       '續&M', 10);

      -- Leads: the core entity
      CREATE TABLE leads (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_date       TEXT    NOT NULL,
        cycle_start      TEXT,
        source_id        INTEGER REFERENCES sources(id),
        sub_source       TEXT    NOT NULL DEFAULT '',
        assistant_id     INTEGER REFERENCES users(id),
        sales_id         INTEGER REFERENCES users(id),
        status           TEXT    NOT NULL DEFAULT 'pending_contact',
        name             TEXT    NOT NULL DEFAULT '',
        phone            TEXT    NOT NULL DEFAULT '',
        email            TEXT    NOT NULL DEFAULT '' COLLATE NOCASE,
        line_id          TEXT    NOT NULL DEFAULT '',
        age_group        TEXT    NOT NULL DEFAULT '',
        need             TEXT    NOT NULL DEFAULT '',
        student_type     TEXT    NOT NULL DEFAULT '',
        note             TEXT    NOT NULL DEFAULT '',
        expected_depart  TEXT,
        expected_weeks   INTEGER,
        next_contact     TEXT,
        data_error_flag  INTEGER NOT NULL DEFAULT 0 CHECK (data_error_flag IN (0,1)),
        created_at       TEXT    NOT NULL,
        updated_at       TEXT    NOT NULL,
        archived_at      TEXT
      );
      CREATE INDEX leads_status     ON leads(status);
      CREATE INDEX leads_assistant  ON leads(assistant_id);
      CREATE INDEX leads_sales      ON leads(sales_id);
      CREATE INDEX leads_source     ON leads(source_id);
      CREATE INDEX leads_next_contact ON leads(next_contact);

      -- Multiple submissions can feed one lead (duplicate handling)
      CREATE TABLE lead_submissions (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id      INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        submitted_at TEXT    NOT NULL,
        source_id    INTEGER REFERENCES sources(id),
        note         TEXT    NOT NULL DEFAULT ''
      );
      CREATE INDEX lead_submissions_lead ON lead_submissions(lead_id);

      -- Contact log: each call, message, etc.
      CREATE TABLE contact_logs (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id   INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        user_id   INTEGER NOT NULL REFERENCES users(id),
        channel   TEXT    NOT NULL,
        result    TEXT    NOT NULL,
        note      TEXT    NOT NULL DEFAULT '',
        logged_at TEXT    NOT NULL
      );
      CREATE INDEX contact_logs_lead ON contact_logs(lead_id);

      -- Stage events: 有效 / 諮詢 / 預約試聽 / 試聽
      CREATE TABLE stage_events (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id    INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        user_id    INTEGER NOT NULL REFERENCES users(id),
        stage      TEXT    NOT NULL CHECK (stage IN ('valid','consult','invite_trial','trial')),
        event_date TEXT    NOT NULL,
        note       TEXT    NOT NULL DEFAULT ''
      );
      CREATE INDEX stage_events_lead ON stage_events(lead_id);

      -- Consult invites: invitations to consultation sessions
      CREATE TABLE consult_invites (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id       INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        invited_by    INTEGER NOT NULL REFERENCES users(id),
        invited_at    TEXT    NOT NULL,
        scheduled_at  TEXT,
        attendance    TEXT    NOT NULL DEFAULT 'pending' CHECK (attendance IN ('pending','attended','absent')),
        absent_reason TEXT    NOT NULL DEFAULT ''
      );
      CREATE INDEX consult_invites_lead ON consult_invites(lead_id);

      -- Deals: won leads with financial details
      CREATE TABLE deals (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id         INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        deal_date       TEXT    NOT NULL,
        lodging         TEXT    NOT NULL DEFAULT '' CHECK (lodging IN ('','homestay','dormitory')),
        program_type    TEXT    NOT NULL DEFAULT '' CHECK (program_type IN ('','regular','camp')),
        plan            TEXT    NOT NULL DEFAULT '',
        campus          TEXT    NOT NULL DEFAULT '',
        depart_date     TEXT,
        return_date     TEXT,
        weeks           INTEGER,
        quote_usd       REAL,
        fx_rate         REAL,
        amount_twd      REAL,
        reg_fee_usd     REAL    NOT NULL DEFAULT 100,
        commission_rate REAL    NOT NULL DEFAULT 0.35,
        net_usd         REAL,
        net_twd         REAL,
        paid_currency   TEXT    NOT NULL DEFAULT 'TWD' CHECK (paid_currency IN ('TWD','USD')),
        paid_amount     REAL,
        key_points      TEXT    NOT NULL DEFAULT '',
        note            TEXT    NOT NULL DEFAULT '',
        created_at      TEXT    NOT NULL,
        updated_at      TEXT    NOT NULL
      );
      CREATE INDEX deals_lead ON deals(lead_id);

      -- Audit log: immutable record of changes
      CREATE TABLE audit_log (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        lead_id INTEGER REFERENCES leads(id),
        entity  TEXT    NOT NULL,
        action  TEXT    NOT NULL,
        changes TEXT    NOT NULL DEFAULT '{}',
        at      TEXT    NOT NULL
      );
      CREATE INDEX audit_log_lead ON audit_log(lead_id);
      CREATE INDEX audit_log_at   ON audit_log(at);

      -- Key-value settings
      CREATE TABLE settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      -- Seed default settings
      INSERT INTO settings (key, value) VALUES
        ('peak_months',       '1,2,7,8'),
        ('countdown_new',     '3'),
        ('countdown_grace',   '1'),
        ('countdown_active',  '10'),
        ('countdown_consult', '30'),
        ('default_reg_fee',   '100'),
        ('default_rate_normal', '0.35'),
        ('default_rate_camp',   '0.25'),
        ('default_rate_day',    '0.20'),
        ('dashboard_visibility', 'admin,sales');
    `,
  },
  {
    id: 3,
    sql: `
      -- New lead columns: lead_note (list-level memo), season (peak/off), deleted_at (admin soft-delete)
      ALTER TABLE leads ADD COLUMN lead_note       TEXT NOT NULL DEFAULT '';
      ALTER TABLE leads ADD COLUMN season          TEXT NOT NULL DEFAULT '' CHECK (season IN ('','peak','off'));
      ALTER TABLE leads ADD COLUMN deleted_at       TEXT;

      -- Deals: bonus share columns
      ALTER TABLE deals ADD COLUMN assistant_share_pct REAL;
      ALTER TABLE deals ADD COLUMN sales_bonus        REAL;
      ALTER TABLE deals ADD COLUMN assistant_bonus     REAL;

      -- Attendance: clock-in / clock-out records
      CREATE TABLE attendance (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date       TEXT    NOT NULL,
        check_in   TEXT,
        check_out  TEXT,
        note       TEXT    NOT NULL DEFAULT '',
        created_at TEXT    NOT NULL,
        UNIQUE(user_id, date)
      );
      CREATE INDEX attendance_user_date ON attendance(user_id, date);

      -- Shifts: submitted schedules, approved by admin
      CREATE TABLE shifts (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date            TEXT    NOT NULL,
        start_time      TEXT    NOT NULL,
        end_time        TEXT    NOT NULL,
        shift_type      TEXT    NOT NULL DEFAULT 'regular' CHECK (shift_type IN ('regular','day_off','leave')),
        status          TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected')),
        approved_by     INTEGER REFERENCES users(id),
        rejected_reason TEXT    NOT NULL DEFAULT '',
        note            TEXT    NOT NULL DEFAULT '',
        created_at      TEXT    NOT NULL
      );
      CREATE INDEX shifts_user_date   ON shifts(user_id, date);
      CREATE INDEX shifts_status      ON shifts(status);

      -- Commission rules (settings-based for now; v1 uses fixed rates)
      INSERT OR IGNORE INTO settings (key, value) VALUES
        ('default_assistant_share_pct', '0'),
        ('bonus_settlement_day',        '1');
    `,
  },
  {
    // 4 — lead entry time and consultation notes
    id: 4,
    sql: `
      -- 進單時間: the clock time a lead reached us, beside the existing 進單日.
      -- Kept separate from entry_date so imports can carry the real enquiry
      -- time while existing rows stay valid with an empty time.
      ALTER TABLE leads ADD COLUMN entry_time TEXT NOT NULL DEFAULT '';

      -- 諮詢筆記: free-text notes staff add by hand on the lead page. Separate
      -- from the 狀態紀錄 feed, which is built from events the system records.
      CREATE TABLE lead_notes (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id    INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        user_id    INTEGER NOT NULL REFERENCES users(id),
        body       TEXT    NOT NULL,
        created_at TEXT    NOT NULL,
        updated_at TEXT    NOT NULL
      );
      CREATE INDEX lead_notes_lead ON lead_notes(lead_id, created_at);
    `,
  },
];
