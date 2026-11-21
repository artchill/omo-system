import "server-only";
import { db } from "./index";

export type AuditLogRow = {
  id: number;
  user_id: number | null;
  lead_id: number | null;
  entity: string;
  action: string;
  changes: string;
  at: string;
  user_name?: string;
  lead_name?: string;
};

/** Record a change to the audit log. `changes` is a JSON string of {field: [old, new]}. */
export function insertAuditLog(entry: {
  user_id: number;
  lead_id?: number;
  entity: string;
  action: string;
  changes: Record<string, unknown>;
}) {
  db()
    .prepare(
      `INSERT INTO audit_log (user_id, lead_id, entity, action, changes, at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      entry.user_id,
      entry.lead_id ?? null,
      entry.entity,
      entry.action,
      JSON.stringify(entry.changes),
      new Date().toISOString(),
    );
}

export type AuditLogFilter = {
  leadId?: number;
  entity?: string;
  limit?: number;
  offset?: number;
};

export function listAuditLogs(filter: AuditLogFilter = {}): {
  rows: AuditLogRow[];
  total: number;
} {
  const where: string[] = [];
  const params: (string | number | null)[] = [];

  if (filter.leadId) {
    where.push("a.lead_id = ?");
    params.push(filter.leadId);
  }
  if (filter.entity) {
    where.push("a.entity = ?");
    params.push(filter.entity);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const total = Number(
    db()
      .prepare(`SELECT COUNT(*) AS n FROM audit_log a ${whereClause}`)
      .get(...params)?.n ?? 0,
  );

  const limit = filter.limit ?? 50;
  const offset = filter.offset ?? 0;

  const rows = db()
    .prepare(
      `SELECT a.*, u.name AS user_name, l.name AS lead_name
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN leads l ON l.id = a.lead_id
       ${whereClause}
       ORDER BY a.at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as unknown as AuditLogRow[];

  return { rows, total };
}
