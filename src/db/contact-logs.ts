import "server-only";
import { db } from "./index";

export type ContactLogRow = {
  id: number;
  lead_id: number;
  user_id: number;
  channel: string;
  result: string;
  note: string;
  logged_at: string;
  user_name?: string;
};

export function listContactLogs(leadId: number): ContactLogRow[] {
  return db()
    .prepare(
      `SELECT cl.*, u.name AS user_name
       FROM contact_logs cl
       LEFT JOIN users u ON u.id = cl.user_id
       WHERE cl.lead_id = ?
       ORDER BY cl.logged_at DESC`,
    )
    .all(leadId) as unknown as ContactLogRow[];
}

export function insertContactLog(log: {
  lead_id: number;
  user_id: number;
  channel: string;
  result: string;
  note: string;
  logged_at?: string;
}): number {
  const r = db()
    .prepare(
      `INSERT INTO contact_logs (lead_id, user_id, channel, result, note, logged_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(log.lead_id, log.user_id, log.channel, log.result, log.note, log.logged_at || new Date().toISOString());
  return Number(r.lastInsertRowid);
}

export function countContactLogs(leadId: number): number {
  return Number(
    db()
      .prepare("SELECT COUNT(*) AS n FROM contact_logs WHERE lead_id = ?")
      .get(leadId)?.n ?? 0,
  );
}
