import "server-only";
import { db } from "./index";

/**
 * 諮詢筆記 — free text staff write by hand on a lead.
 *
 * Deliberately separate from the 狀態紀錄 feed: that feed is assembled from
 * events the system records (status changes, contact logs, stages, invites,
 * deals), while these are notes a person chose to write.
 */
export type LeadNoteRow = {
  id: number;
  lead_id: number;
  user_id: number;
  body: string;
  created_at: string;
  updated_at: string;
  /** Joined for display. */
  user_name?: string | null;
};

const now = () => new Date().toISOString();

export function listLeadNotes(leadId: number): LeadNoteRow[] {
  return db()
    .prepare(
      `SELECT n.*, u.name AS user_name
         FROM lead_notes n
         LEFT JOIN users u ON u.id = n.user_id
        WHERE n.lead_id = ?
        ORDER BY n.created_at DESC`,
    )
    .all(leadId) as unknown as LeadNoteRow[];
}

export function insertLeadNote(leadId: number, userId: number, body: string): number {
  const t = now();
  const r = db()
    .prepare(
      `INSERT INTO lead_notes (lead_id, user_id, body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(leadId, userId, body, t, t);
  return Number(r.lastInsertRowid);
}

export function updateLeadNote(id: number, body: string) {
  db()
    .prepare("UPDATE lead_notes SET body = ?, updated_at = ? WHERE id = ?")
    .run(body, now(), id);
}

export function deleteLeadNote(id: number) {
  db().prepare("DELETE FROM lead_notes WHERE id = ?").run(id);
}

export function findLeadNoteById(id: number): LeadNoteRow | undefined {
  return db().prepare("SELECT * FROM lead_notes WHERE id = ?").get(id) as
    | LeadNoteRow
    | undefined;
}
