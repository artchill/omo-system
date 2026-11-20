/**
 * Lead status codes. These are what the database stores.
 * Display labels live in messages/*.json under "LeadStatus" and must have
 * one entry per code (the type checker and `npm run check:i18n` enforce it).
 */
export const LEAD_STATUSES = [
  "pending_contact",
  "unreachable",
  "touched_follow_up",
  "touched_gone_quiet",
  "consulted_gone_quiet",
  "consulted_considering",
  "consulting",
  "on_hold",
  "closed_invalid",
  "closed_unreachable",
  "closed_not_interested",
  "closed_not_converting",
  "closed_conflict",
  "won",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type LeadStatusGroup = "open" | "paused" | "closed" | "won";

/** Which column of the pipeline a status belongs to (used for colours and counts). */
export function statusGroup(status: LeadStatus): LeadStatusGroup {
  if (status === "won") return "won";
  if (status === "on_hold") return "paused";
  if (status.startsWith("closed_")) return "closed";
  return "open";
}
