import "server-only";
import { db } from "./index";
import type { LeadStatus } from "@/domain/lead-status";

export type LeadRow = {
  id: number;
  entry_date: string;
  cycle_start: string | null;
  source_id: number | null;
  sub_source: string;
  assistant_id: number | null;
  sales_id: number | null;
  status: LeadStatus;
  name: string;
  phone: string;
  email: string;
  line_id: string;
  age_group: string;
  need: string;
  student_type: string;
  note: string;
  expected_depart: string | null;
  expected_weeks: number | null;
  next_contact: string | null;
  data_error_flag: number;
  lead_note: string;
  season: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

/** Extended lead row with joined source/user names for list views */
export type LeadListRow = LeadRow & {
  source_name: string | null;
  assistant_name: string | null;
  sales_name: string | null;
  contact_count: number;
  latest_stage: string | null;
};

const now = () => new Date().toISOString();

export function countLeads(): number {
  return Number(
    (db().prepare("SELECT COUNT(*) AS n FROM leads WHERE archived_at IS NULL AND deleted_at IS NULL").get() as { n: number } | undefined)?.n ?? 0,
  );
}

export type LeadListFilter = {
  status?: LeadStatus;
  assistantId?: number;
  salesId?: number;
  sourceId?: number;
  season?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export function listLeads(filter: LeadListFilter = {}): {
  rows: LeadListRow[];
  total: number;
} {
  const where: string[] = ["l.archived_at IS NULL", "l.deleted_at IS NULL"];
  const params: (string | number | null)[] = [];

  if (filter.status) {
    where.push("l.status = ?");
    params.push(filter.status);
  }
  if (filter.assistantId) {
    where.push("l.assistant_id = ?");
    params.push(filter.assistantId);
  }
  if (filter.salesId) {
    where.push("l.sales_id = ?");
    params.push(filter.salesId);
  }
  if (filter.sourceId) {
    where.push("l.source_id = ?");
    params.push(filter.sourceId);
  }
  if (filter.season) {
    where.push("l.season = ?");
    params.push(filter.season);
  }
  if (filter.search) {
    where.push(
      "(l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ? OR l.line_id LIKE ? OR l.lead_note LIKE ?)",
    );
    const q = `%${filter.search}%`;
    params.push(q, q, q, q, q);
  }

  const whereClause = where.join(" AND ");

  const countRow = db()
    .prepare(`SELECT COUNT(*) AS n FROM leads l WHERE ${whereClause}`)
    .get(...params) as { n: number };
  const total = Number(countRow.n);

  const limit = filter.limit ?? 50;
  const offset = filter.offset ?? 0;

  const rows = db()
    .prepare(
      `SELECT l.*,
              s.name AS source_name,
              ua.name AS assistant_name,
              us.name AS sales_name,
              (SELECT COUNT(*) FROM contact_logs cl WHERE cl.lead_id = l.id) AS contact_count,
              (SELECT se.stage FROM stage_events se WHERE se.lead_id = l.id ORDER BY se.event_date DESC LIMIT 1) AS latest_stage
       FROM leads l
       LEFT JOIN sources s  ON s.id  = l.source_id
       LEFT JOIN users   ua ON ua.id = l.assistant_id
       LEFT JOIN users   us ON us.id = l.sales_id
       WHERE ${whereClause}
       ORDER BY l.updated_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as unknown as LeadListRow[];

  return { rows, total };
}

export function findLeadById(id: number): LeadListRow | undefined {
  return db()
    .prepare(
      `SELECT l.*,
              s.name AS source_name,
              ua.name AS assistant_name,
              us.name AS sales_name,
              (SELECT COUNT(*) FROM contact_logs cl WHERE cl.lead_id = l.id) AS contact_count,
              (SELECT se.stage FROM stage_events se WHERE se.lead_id = l.id ORDER BY se.event_date DESC LIMIT 1) AS latest_stage
       FROM leads l
       LEFT JOIN sources s  ON s.id  = l.source_id
       LEFT JOIN users   ua ON ua.id = l.assistant_id
       LEFT JOIN users   us ON us.id = l.sales_id
       WHERE l.id = ?`,
    )
    .get(id) as LeadListRow | undefined;
}

export type NewLead = {
  entry_date: string;
  source_id?: number;
  sub_source?: string;
  assistant_id?: number;
  sales_id?: number;
  name: string;
  phone?: string;
  email?: string;
  line_id?: string;
  age_group?: string;
  need?: string;
  student_type?: string;
  note?: string;
  expected_depart?: string;
  expected_weeks?: number;
  next_contact?: string;
  lead_note?: string;
  season?: string;
};

export function insertLead(l: NewLead): number {
  const t = now();
  const r = db()
    .prepare(
      `INSERT INTO leads (
        entry_date, cycle_start, source_id, sub_source,
        assistant_id, sales_id, status,
        name, phone, email, line_id,
        age_group, need, student_type, note,
        expected_depart, expected_weeks, next_contact,
        lead_note, season,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending_contact', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      l.entry_date,
      l.entry_date, // cycle_start = entry_date initially
      l.source_id ?? null,
      l.sub_source ?? "",
      l.assistant_id ?? null,
      l.sales_id ?? null,
      l.name,
      l.phone ?? "",
      l.email ?? "",
      l.line_id ?? "",
      l.age_group ?? "",
      l.need ?? "",
      l.student_type ?? "",
      l.note ?? "",
      l.expected_depart ?? null,
      l.expected_weeks ?? null,
      l.next_contact ?? null,
      l.lead_note ?? "",
      l.season ?? "",
      t,
      t,
    );
  return Number(r.lastInsertRowid);
}

export function updateLead(
  id: number,
  fields: Partial<
    Omit<LeadRow, "id" | "created_at" | "updated_at" | "archived_at">
  >,
) {
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = ?`);
    vals.push((v as string | number | null) ?? null);
  }
  sets.push("updated_at = ?");
  vals.push(now());
  vals.push(id);
  db()
    .prepare(`UPDATE leads SET ${sets.join(", ")} WHERE id = ?`)
    .run(...vals);
}

export function archiveLead(id: number) {
  db()
    .prepare("UPDATE leads SET archived_at = ?, updated_at = ? WHERE id = ?")
    .run(now(), now(), id);
}

/** Soft-delete a lead (admin only). Sets deleted_at timestamp. */
export function softDeleteLead(id: number) {
  db()
    .prepare("UPDATE leads SET deleted_at = ?, updated_at = ? WHERE id = ?")
    .run(now(), now(), id);
}

/** Check for potential duplicates by email, phone, or LINE ID */
export function findDuplicates(
  email: string,
  phone: string,
  lineId: string,
  excludeId?: number,
): LeadRow[] {
  if (!email && !phone && !lineId) return [];
  const conds: string[] = [];
  const params: (string | number | null)[] = [];
  if (email) {
    conds.push("email = ? COLLATE NOCASE");
    params.push(email);
  }
  if (phone) {
    conds.push("phone = ?");
    params.push(phone);
  }
  if (lineId) {
    conds.push("line_id = ?");
    params.push(lineId);
  }
  let sql = `SELECT * FROM leads WHERE archived_at IS NULL AND deleted_at IS NULL AND (${conds.join(" OR ")})`;
  if (excludeId) {
    sql += " AND id != ?";
    params.push(excludeId);
  }
  return db().prepare(sql).all(...params) as unknown as LeadRow[];
}
