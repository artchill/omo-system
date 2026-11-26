import "server-only";
import { db } from "./index";

/**
 * 狀態紀錄 — one continuous record of everything that happened to a lead.
 *
 * The lead page used to show four separate tabs. They are assembled here into
 * a single stream instead, each entry tagged with the kind of change it was,
 * so a person reads the history in the order it happened rather than piecing
 * it together across tabs.
 *
 * Entries are derived from the tables that already record these events, so a
 * contact log added anywhere, or a stage changed from the top of the page,
 * shows up here without anything extra being written.
 */
export type TimelineKind =
  | "status"
  | "stage"
  | "contact"
  | "invite"
  | "deal"
  | "edit";

export type TimelineEntry = {
  /** Unique across sources — the kind plus the source row's id. */
  key: string;
  kind: TimelineKind;
  /** ISO timestamp, or a bare YYYY-MM-DD where that is all the source has. */
  at: string;
  user_name: string | null;
  /** An option code the page translates (channel, stage, status…), if any. */
  code: string;
  /** A second code, such as a contact result. */
  code2: string;
  /** Free text the user wrote. */
  note: string;
  /** Short extra facts already formatted for display. */
  extra: string;
};

type Row = Record<string, unknown>;
const str = (v: unknown) => (v == null ? "" : String(v));

export function listLeadTimeline(leadId: number): TimelineEntry[] {
  const d = db();
  const entries: TimelineEntry[] = [];

  // 聯繫紀錄
  for (const r of d
    .prepare(
      `SELECT c.id, c.channel, c.result, c.note, c.logged_at, u.name AS user_name
         FROM contact_logs c LEFT JOIN users u ON u.id = c.user_id
        WHERE c.lead_id = ?`,
    )
    .all(leadId) as Row[]) {
    entries.push({
      key: `contact-${r.id}`,
      kind: "contact",
      at: str(r.logged_at),
      user_name: str(r.user_name) || null,
      code: str(r.channel),
      code2: str(r.result),
      note: str(r.note),
      extra: "",
    });
  }

  // 階段紀錄
  for (const r of d
    .prepare(
      `SELECT s.id, s.stage, s.event_date, s.note, u.name AS user_name
         FROM stage_events s LEFT JOIN users u ON u.id = s.user_id
        WHERE s.lead_id = ?`,
    )
    .all(leadId) as Row[]) {
    entries.push({
      key: `stage-${r.id}`,
      kind: "stage",
      at: str(r.event_date),
      user_name: str(r.user_name) || null,
      code: str(r.stage),
      code2: "",
      note: str(r.note),
      extra: "",
    });
  }

  // 諮詢邀約
  for (const r of d
    .prepare(
      `SELECT i.id, i.invited_at, i.scheduled_at, i.attendance, i.absent_reason,
              u.name AS user_name
         FROM consult_invites i LEFT JOIN users u ON u.id = i.invited_by
        WHERE i.lead_id = ?`,
    )
    .all(leadId) as Row[]) {
    entries.push({
      key: `invite-${r.id}`,
      kind: "invite",
      at: str(r.invited_at),
      user_name: str(r.user_name) || null,
      code: str(r.attendance),
      code2: str(r.absent_reason),
      note: "",
      extra: str(r.scheduled_at),
    });
  }

  // 成交紀錄
  for (const r of d
    .prepare(
      `SELECT id, deal_date, amount_twd, program_type, note, created_at
         FROM deals WHERE lead_id = ?`,
    )
    .all(leadId) as Row[]) {
    entries.push({
      key: `deal-${r.id}`,
      kind: "deal",
      at: str(r.created_at) || str(r.deal_date),
      user_name: null,
      code: str(r.program_type),
      code2: "",
      note: str(r.note),
      extra: r.amount_twd == null ? "" : `NT$${Number(r.amount_twd).toLocaleString("en-US")}`,
    });
  }

  // 狀態變更與資料異動, from the audit trail that already records them
  for (const r of d
    .prepare(
      `SELECT a.id, a.action, a.changes, a.at, u.name AS user_name
         FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
        WHERE a.lead_id = ? AND a.entity = 'lead'`,
    )
    .all(leadId) as Row[]) {
    const action = str(r.action);
    if (action === "status_change") {
      let from = "";
      let to = "";
      try {
        const parsed = JSON.parse(str(r.changes)) as Record<string, unknown>;
        const pair = parsed.status;
        if (Array.isArray(pair)) {
          from = str(pair[0]);
          to = str(pair[1]);
        }
      } catch {
        /* a malformed row should not break the page */
      }
      entries.push({
        key: `status-${r.id}`,
        kind: "status",
        at: str(r.at),
        user_name: str(r.user_name) || null,
        code: from,
        code2: to,
        note: "",
        extra: "",
      });
    } else if (action === "update") {
      let fields: string[] = [];
      try {
        fields = Object.keys(JSON.parse(str(r.changes)) as Record<string, unknown>);
      } catch {
        /* ignore */
      }
      if (fields.length === 0) continue;
      entries.push({
        key: `edit-${r.id}`,
        kind: "edit",
        at: str(r.at),
        user_name: str(r.user_name) || null,
        code: "",
        code2: "",
        note: "",
        extra: fields.join(", "),
      });
    }
  }

  // Newest first. A stage carries only a date, which sorts before any clock
  // time on the same day — acceptable, and better than dropping it.
  entries.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return entries;
}
