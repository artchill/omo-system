import "server-only";
import { db } from "./index";
import type { StageType } from "@/domain/enums";

export type StageEventRow = {
  id: number;
  lead_id: number;
  user_id: number;
  stage: StageType;
  event_date: string;
  note: string;
  user_name?: string;
};

export function listStageEvents(leadId: number): StageEventRow[] {
  return db()
    .prepare(
      `SELECT se.*, u.name AS user_name
       FROM stage_events se
       LEFT JOIN users u ON u.id = se.user_id
       WHERE se.lead_id = ?
       ORDER BY se.event_date DESC`,
    )
    .all(leadId) as unknown as StageEventRow[];
}

export function insertStageEvent(e: {
  lead_id: number;
  user_id: number;
  stage: StageType;
  event_date: string;
  note: string;
}): number {
  const r = db()
    .prepare(
      `INSERT INTO stage_events (lead_id, user_id, stage, event_date, note)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(e.lead_id, e.user_id, e.stage, e.event_date, e.note);
  return Number(r.lastInsertRowid);
}

export function hasStage(leadId: number, stage: StageType): boolean {
  return !!db()
    .prepare("SELECT 1 FROM stage_events WHERE lead_id = ? AND stage = ?")
    .get(leadId, stage);
}
