"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { can } from "@/domain/roles";
import { LEAD_STATUSES, type LeadStatus } from "@/domain/lead-status";
import { insertAuditLog } from "@/db/audit-log";
import {
  insertLead,
  updateLead,
  archiveLead,
  softDeleteLead,
  findLeadById,
  findDuplicates,
} from "@/db/leads";
import { insertContactLog } from "@/db/contact-logs";
import { insertStageEvent } from "@/db/stage-events";
import { insertConsultInvite, updateConsultAttendance } from "@/db/consult-invites";
import { insertDeal, type NewDeal } from "@/db/deals";
import { getCommissionDefaults, isPeakSeason } from "@/db/settings";
import { CONTACT_CHANNELS, CONTACT_RESULTS, STAGE_TYPES, ATTENDANCE_VALUES, SEASONS } from "@/domain/enums";
import { cleanText } from "@/lib/validate";
import { todayISO } from "@/lib/format";

/** Season is optional; anything not in SEASONS collapses to "" (matches the DB CHECK). */
function cleanSeason(raw: FormDataEntryValue | null): string {
  const v = cleanText(raw, 10);
  return (SEASONS as readonly string[]).includes(v) ? v : "";
}

// ── Create Lead ───────────────────────────────────────────────────
export async function createLeadAction(fd: FormData) {
  const user = await requireUser();
  if (!can(user.role, "leads.create")) return { error: "permissionDenied" as const };

  const name = cleanText(fd.get("name"), 100);
  if (!name) return { error: "name" as const };

  const phone = cleanText(fd.get("phone"), 30);
  const email = cleanText(fd.get("email"), 254);
  const lineId = cleanText(fd.get("line_id"), 50);

  // Duplicate check
  const dupes = findDuplicates(email, phone, lineId);
  // We still allow creation, but we return the warning
  const duplicateWarning = dupes.length > 0;

  const sourceId = parseInt(String(fd.get("source_id") ?? ""), 10) || undefined;
  const assistantId = parseInt(String(fd.get("assistant_id") ?? ""), 10) || undefined;
  const salesId = parseInt(String(fd.get("sales_id") ?? ""), 10) || undefined;

  const id = insertLead({
    entry_date: cleanText(fd.get("entry_date"), 10) || todayISO(),
    source_id: sourceId,
    sub_source: cleanText(fd.get("sub_source"), 100),
    assistant_id: assistantId,
    sales_id: salesId,
    name,
    phone,
    email,
    line_id: lineId,
    age_group: cleanText(fd.get("age_group"), 20),
    need: cleanText(fd.get("need"), 30),
    student_type: cleanText(fd.get("student_type"), 20),
    note: cleanText(fd.get("note"), 1000),
    expected_depart: cleanText(fd.get("expected_depart"), 10) || undefined,
    expected_weeks: parseInt(String(fd.get("expected_weeks") ?? ""), 10) || undefined,
    next_contact: cleanText(fd.get("next_contact"), 10) || undefined,
    lead_note: cleanText(fd.get("lead_note"), 500),
    season: cleanSeason(fd.get("season")),
  });

  insertAuditLog({
    user_id: user.id,
    lead_id: id,
    entity: "lead",
    action: "create",
    changes: { name, phone, email },
  });

  revalidatePath("/leads");
  return { id, duplicateWarning };
}

// ── Update Lead ───────────────────────────────────────────────────
export async function updateLeadAction(fd: FormData) {
  const user = await requireUser();
  if (!can(user.role, "leads.edit")) return { error: "permissionDenied" as const };

  const id = parseInt(String(fd.get("id") ?? "0"), 10);
  const existing = findLeadById(id);
  if (!existing) return { error: "leadNotFound" as const };

  const fields: Record<string, unknown> = {};
  const changes: Record<string, [unknown, unknown]> = {};

  const TEXT_LIMITS: Record<string, number> = { note: 1000, lead_note: 500 };

  for (const key of [
    "name", "phone", "email", "line_id", "age_group", "need",
    "student_type", "note", "lead_note", "sub_source", "expected_depart",
    "expected_weeks", "next_contact", "entry_date",
  ]) {
    const val = fd.get(key);
    if (val !== null) {
      const cleaned = key === "expected_weeks"
        ? (parseInt(String(val), 10) || null)
        : cleanText(val, TEXT_LIMITS[key] ?? 254);
      const oldVal = (existing as Record<string, unknown>)[key];
      if (String(cleaned ?? "") !== String(oldVal ?? "")) {
        fields[key] = cleaned;
        changes[key] = [oldVal, cleaned];
      }
    }
  }

  // Season: validated against SEASONS, "" clears it
  if (fd.get("season") !== null) {
    const season = cleanSeason(fd.get("season"));
    if (season !== existing.season) {
      fields.season = season;
      changes.season = [existing.season, season];
    }
  }

  // Source / assistant / sales
  for (const key of ["source_id", "assistant_id", "sales_id"]) {
    const val = parseInt(String(fd.get(key) ?? ""), 10) || null;
    const oldVal = (existing as Record<string, unknown>)[key];
    if (val !== oldVal) {
      fields[key] = val;
      changes[key] = [oldVal, val];
    }
  }

  if (Object.keys(fields).length > 0) {
    updateLead(id, fields);
    insertAuditLog({
      user_id: user.id,
      lead_id: id,
      entity: "lead",
      action: "update",
      changes,
    });
  }

  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  return {};
}

// ── Change Status ─────────────────────────────────────────────────
export async function changeStatusAction(fd: FormData) {
  const user = await requireUser();
  if (!can(user.role, "leads.edit")) return { error: "permissionDenied" as const };

  const id = parseInt(String(fd.get("id") ?? "0"), 10);
  const status = cleanText(fd.get("status"), 30) as LeadStatus;
  if (!LEAD_STATUSES.includes(status)) return { error: "generic" as const };

  const existing = findLeadById(id);
  if (!existing) return { error: "leadNotFound" as const };

  const oldStatus = existing.status;
  updateLead(id, { status });

  // If status changed to won, also reset cycle_start
  if (status === "won" && oldStatus !== "won") {
    updateLead(id, { cycle_start: todayISO() });
  }

  insertAuditLog({
    user_id: user.id,
    lead_id: id,
    entity: "lead",
    action: "status_change",
    changes: { status: [oldStatus, status] },
  });

  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
  return {};
}

// ── Archive Lead ──────────────────────────────────────────────────
export async function archiveLeadAction(fd: FormData) {
  const user = await requireUser();
  if (!can(user.role, "leads.edit")) return { error: "permissionDenied" as const };

  const id = parseInt(String(fd.get("id") ?? "0"), 10);
  archiveLead(id);
  insertAuditLog({
    user_id: user.id,
    lead_id: id,
    entity: "lead",
    action: "archive",
    changes: {},
  });

  revalidatePath("/leads");
  return {};
}

// ── Soft Delete Lead (admin only) ─────────────────────────────────
export async function softDeleteLeadAction(fd: FormData) {
  const user = await requireUser();
  if (!can(user.role, "leads.delete")) return { error: "permissionDenied" as const };

  const id = parseInt(String(fd.get("id") ?? "0"), 10);
  const existing = findLeadById(id);
  if (!existing) return { error: "leadNotFound" as const };

  softDeleteLead(id);
  insertAuditLog({
    user_id: user.id,
    lead_id: id,
    entity: "lead",
    action: "soft_delete",
    changes: { name: existing.name },
  });

  revalidatePath("/leads");
  return {};
}

// ── Add Contact Log ───────────────────────────────────────────────
export async function addContactLogAction(fd: FormData) {
  const user = await requireUser();
  const leadId = parseInt(String(fd.get("lead_id") ?? "0"), 10);
  const channel = cleanText(fd.get("channel"), 20);
  const result = cleanText(fd.get("result"), 20);
  const note = cleanText(fd.get("note"), 1000);
  const loggedTime = cleanText(fd.get("logged_time"), 30);

  if (!CONTACT_CHANNELS.includes(channel as typeof CONTACT_CHANNELS[number]))
    return { error: "generic" as const };
  // Result is optional — validate only when provided
  if (result && !CONTACT_RESULTS.includes(result as typeof CONTACT_RESULTS[number]))
    return { error: "generic" as const };

  insertContactLog({
    lead_id: leadId,
    user_id: user.id,
    channel,
    result: result || "",
    note,
    logged_at: loggedTime || undefined,
  });
  insertAuditLog({
    user_id: user.id,
    lead_id: leadId,
    entity: "contact_log",
    action: "create",
    changes: { channel, result },
  });

  revalidatePath(`/leads/${leadId}`);
  return {};
}

// ── Add Stage Event ───────────────────────────────────────────────
export async function addStageEventAction(fd: FormData) {
  const user = await requireUser();
  const leadId = parseInt(String(fd.get("lead_id") ?? "0"), 10);
  const stage = cleanText(fd.get("stage"), 20);
  const eventDate = cleanText(fd.get("event_date"), 10) || todayISO();
  const note = cleanText(fd.get("note"), 1000);

  if (!STAGE_TYPES.includes(stage as typeof STAGE_TYPES[number]))
    return { error: "generic" as const };

  insertStageEvent({ lead_id: leadId, user_id: user.id, stage: stage as typeof STAGE_TYPES[number], event_date: eventDate, note });
  insertAuditLog({
    user_id: user.id,
    lead_id: leadId,
    entity: "stage_event",
    action: "create",
    changes: { stage, eventDate },
  });

  revalidatePath(`/leads/${leadId}`);
  return {};
}

// ── Add Consult Invite ────────────────────────────────────────────
export async function addConsultInviteAction(fd: FormData) {
  const user = await requireUser();
  const leadId = parseInt(String(fd.get("lead_id") ?? "0"), 10);
  const scheduledAt = cleanText(fd.get("scheduled_at"), 20) || undefined;

  insertConsultInvite({ lead_id: leadId, invited_by: user.id, scheduled_at: scheduledAt });
  insertAuditLog({
    user_id: user.id,
    lead_id: leadId,
    entity: "consult_invite",
    action: "create",
    changes: { scheduledAt },
  });

  revalidatePath(`/leads/${leadId}`);
  return {};
}

// ── Update Consult Attendance ─────────────────────────────────────
export async function updateAttendanceAction(fd: FormData) {
  const user = await requireUser();
  const id = parseInt(String(fd.get("id") ?? "0"), 10);
  const leadId = parseInt(String(fd.get("lead_id") ?? "0"), 10);
  const attendance = cleanText(fd.get("attendance"), 20);
  const absentReason = cleanText(fd.get("absent_reason"), 100);

  if (!ATTENDANCE_VALUES.includes(attendance as typeof ATTENDANCE_VALUES[number]))
    return { error: "generic" as const };

  updateConsultAttendance(id, attendance as typeof ATTENDANCE_VALUES[number], absentReason);
  insertAuditLog({
    user_id: user.id,
    lead_id: leadId,
    entity: "consult_invite",
    action: "update_attendance",
    changes: { attendance, absentReason },
  });

  revalidatePath(`/leads/${leadId}`);
  return {};
}

// ── Register Deal ─────────────────────────────────────────────────
export async function registerDealAction(fd: FormData) {
  const user = await requireUser();
  if (!can(user.role, "deals.create")) return { error: "permissionDenied" as const };

  const leadId = parseInt(String(fd.get("lead_id") ?? "0"), 10);
  const existing = findLeadById(leadId);
  if (!existing) return { error: "leadNotFound" as const };

  const defaults = getCommissionDefaults();
  const quoteUsd = parseFloat(String(fd.get("quote_usd") ?? "")) || undefined;
  const fxRate = parseFloat(String(fd.get("fx_rate") ?? "")) || undefined;

  // Reg fee and commission rate: admin/sales can override, assistant uses defaults
  let regFeeUsd = defaults.regFee;
  let commissionRate = defaults.rateNormal;

  if (can(user.role, "deals.edit_financials")) {
    regFeeUsd = parseFloat(String(fd.get("reg_fee_usd") ?? "")) || defaults.regFee;
    commissionRate = parseFloat(String(fd.get("commission_rate") ?? "")) || defaults.rateNormal;
  } else {
    // Assistant: use program_type to pick rate
    const programType = cleanText(fd.get("program_type"), 20);
    if (programType === "camp") {
      commissionRate = defaults.rateCamp;
      regFeeUsd = 0; // CAMP: no reg fee
    }
  }

  // Calculate net
  let netUsd: number | undefined;
  let netTwd: number | undefined;
  let amountTwd: number | undefined;
  if (quoteUsd !== undefined) {
    netUsd = (quoteUsd - regFeeUsd) * commissionRate;
    if (fxRate) {
      amountTwd = quoteUsd * fxRate;
      netTwd = netUsd * fxRate;
    }
  }
  // Allow manual override of amount_twd
  const manualAmountTwd = parseFloat(String(fd.get("amount_twd") ?? ""));
  if (!isNaN(manualAmountTwd)) amountTwd = manualAmountTwd;

  const deal: NewDeal = {
    lead_id: leadId,
    deal_date: cleanText(fd.get("deal_date"), 10) || todayISO(),
    lodging: cleanText(fd.get("lodging"), 20),
    program_type: cleanText(fd.get("program_type"), 20),
    plan: cleanText(fd.get("plan"), 30),
    campus: cleanText(fd.get("campus"), 30),
    depart_date: cleanText(fd.get("depart_date"), 10) || undefined,
    return_date: cleanText(fd.get("return_date"), 10) || undefined,
    weeks: parseInt(String(fd.get("weeks") ?? ""), 10) || undefined,
    quote_usd: quoteUsd,
    fx_rate: fxRate,
    amount_twd: amountTwd,
    reg_fee_usd: regFeeUsd,
    commission_rate: commissionRate,
    net_usd: netUsd,
    net_twd: netTwd,
    paid_currency: cleanText(fd.get("paid_currency"), 5) || "TWD",
    paid_amount: parseFloat(String(fd.get("paid_amount") ?? "")) || undefined,
    key_points: cleanText(fd.get("key_points"), 500),
    note: cleanText(fd.get("note"), 1000),
  };

  const dealId = insertDeal(deal);

  // Set lead status to won
  updateLead(leadId, { status: "won" });

  // Season warning check
  let seasonWarning = "";
  const departDate = deal.depart_date;
  if (departDate) {
    const peak = isPeakSeason(departDate);
    if (deal.program_type === "camp" && !peak) {
      seasonWarning = "off_peak_camp";
    }
  }

  insertAuditLog({
    user_id: user.id,
    lead_id: leadId,
    entity: "deal",
    action: "create",
    changes: { dealId, quoteUsd, netUsd, commissionRate },
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { dealId, seasonWarning };
}
