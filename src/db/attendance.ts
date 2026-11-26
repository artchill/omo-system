import "server-only";
import { db } from "./index";

export type AttendanceRow = {
  id: number;
  user_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  note: string;
  created_at: string;
  user_name?: string;
};

const now = () => new Date().toISOString();

/** List attendance records, optionally filtered by user and/or date range. */
export function listAttendance(opts: {
  userId?: number;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): { rows: AttendanceRow[]; total: number } {
  const where: string[] = [];
  const params: (string | number | null)[] = [];
  if (opts.userId) {
    where.push("a.user_id = ?");
    params.push(opts.userId);
  }
  if (opts.from) {
    where.push("a.date >= ?");
    params.push(opts.from);
  }
  if (opts.to) {
    where.push("a.date <= ?");
    params.push(opts.to);
  }
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const total = Number(
    (
      db()
        .prepare(`SELECT COUNT(*) AS n FROM attendance a ${whereClause}`)
        .get(...params) as { n: number }
    ).n,
  );

  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  const rows = db()
    .prepare(
      `SELECT a.*, u.name AS user_name
       FROM attendance a
       LEFT JOIN users u ON u.id = a.user_id
       ${whereClause}
       ORDER BY a.date DESC, a.check_in DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as unknown as AttendanceRow[];

  return { rows, total };
}

/** Find today's attendance record for a user. */
export function findTodayAttendance(
  userId: number,
  date: string,
): AttendanceRow | undefined {
  return db()
    .prepare("SELECT * FROM attendance WHERE user_id = ? AND date = ?")
    .get(userId, date) as AttendanceRow | undefined;
}

/** Clock in: create a new attendance record. */
export function clockIn(userId: number, date: string): number {
  const t = now();
  const r = db()
    .prepare(
      `INSERT INTO attendance (user_id, date, check_in, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(userId, date, t, t);
  return Number(r.lastInsertRowid);
}

/** Clock out: set check_out on existing record. */
export function clockOut(id: number) {
  db()
    .prepare("UPDATE attendance SET check_out = ? WHERE id = ?")
    .run(now(), id);
}

/** Update attendance note. */
export function updateAttendanceNote(id: number, note: string) {
  db().prepare("UPDATE attendance SET note = ? WHERE id = ?").run(note, id);
}
