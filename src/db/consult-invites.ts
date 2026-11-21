import "server-only";
import { db } from "./index";
import type { Attendance } from "@/domain/enums";

export type ConsultInviteRow = {
  id: number;
  lead_id: number;
  invited_by: number;
  invited_at: string;
  scheduled_at: string | null;
  attendance: Attendance;
  absent_reason: string;
  inviter_name?: string;
};

export function listConsultInvites(leadId: number): ConsultInviteRow[] {
  return db()
    .prepare(
      `SELECT ci.*, u.name AS inviter_name
       FROM consult_invites ci
       LEFT JOIN users u ON u.id = ci.invited_by
       WHERE ci.lead_id = ?
       ORDER BY ci.invited_at DESC`,
    )
    .all(leadId) as unknown as ConsultInviteRow[];
}

export function insertConsultInvite(inv: {
  lead_id: number;
  invited_by: number;
  scheduled_at?: string;
}): number {
  const r = db()
    .prepare(
      `INSERT INTO consult_invites (lead_id, invited_by, invited_at, scheduled_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(
      inv.lead_id,
      inv.invited_by,
      new Date().toISOString(),
      inv.scheduled_at ?? null,
    );
  return Number(r.lastInsertRowid);
}

export function updateConsultAttendance(
  id: number,
  attendance: Attendance,
  absentReason: string,
) {
  db()
    .prepare(
      "UPDATE consult_invites SET attendance = ?, absent_reason = ? WHERE id = ?",
    )
    .run(attendance, absentReason, id);
}
