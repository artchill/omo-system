import "server-only";
import { db } from "./index";

export type ShiftStatus = "draft" | "submitted" | "approved" | "rejected";
export type ShiftType = "regular" | "day_off" | "leave";

export type ShiftRow = {
  id: number;
  user_id: number;
  date: string;
  start_time: string;
  end_time: string;
  shift_type: ShiftType;
  status: ShiftStatus;
  approved_by: number | null;
  rejected_reason: string;
  note: string;
  created_at: string;
  user_name?: string;
  approver_name?: string;
};

const now = () => new Date().toISOString();

/** List shifts, optionally filtered. */
export function listShifts(opts: {
  userId?: number;
  status?: ShiftStatus;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): { rows: ShiftRow[]; total: number } {
  const where: string[] = [];
  const params: (string | number | null)[] = [];
  if (opts.userId) {
    where.push("s.user_id = ?");
    params.push(opts.userId);
  }
  if (opts.status) {
    where.push("s.status = ?");
    params.push(opts.status);
  }
  if (opts.from) {
    where.push("s.date >= ?");
    params.push(opts.from);
  }
  if (opts.to) {
    where.push("s.date <= ?");
    params.push(opts.to);
  }
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const total = Number(
    (
      db()
        .prepare(`SELECT COUNT(*) AS n FROM shifts s ${whereClause}`)
        .get(...params) as { n: number }
    ).n,
  );

  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  const rows = db()
    .prepare(
      `SELECT s.*, u.name AS user_name, ap.name AS approver_name
       FROM shifts s
       LEFT JOIN users u  ON u.id  = s.user_id
       LEFT JOIN users ap ON ap.id = s.approved_by
       ${whereClause}
       ORDER BY s.date ASC, s.start_time ASC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as unknown as ShiftRow[];

  return { rows, total };
}

export type NewShift = {
  user_id: number;
  date: string;
  start_time: string;
  end_time: string;
  shift_type?: ShiftType;
  note?: string;
};

export function insertShift(s: NewShift): number {
  const r = db()
    .prepare(
      `INSERT INTO shifts (user_id, date, start_time, end_time, shift_type, status, note, created_at)
       VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)`,
    )
    .run(
      s.user_id,
      s.date,
      s.start_time,
      s.end_time,
      s.shift_type ?? "regular",
      s.note ?? "",
      now(),
    );
  return Number(r.lastInsertRowid);
}

export function submitShift(id: number) {
  db()
    .prepare("UPDATE shifts SET status = 'submitted' WHERE id = ? AND status = 'draft'")
    .run(id);
}

export function approveShift(id: number, approvedBy: number) {
  db()
    .prepare(
      "UPDATE shifts SET status = 'approved', approved_by = ? WHERE id = ? AND status = 'submitted'",
    )
    .run(approvedBy, id);
}

export function rejectShift(id: number, approvedBy: number, reason: string) {
  db()
    .prepare(
      "UPDATE shifts SET status = 'rejected', approved_by = ?, rejected_reason = ? WHERE id = ? AND status = 'submitted'",
    )
    .run(approvedBy, reason, id);
}

export function deleteShift(id: number) {
  db().prepare("DELETE FROM shifts WHERE id = ? AND status IN ('draft','rejected')").run(id);
}
