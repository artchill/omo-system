/**
 * CRM domain enumerations — stored as these codes in the database.
 * Labels for the UI live in messages/*.json under their respective namespaces.
 */

// ── Contact channels ──────────────────────────────────────────────
export const CONTACT_CHANNELS = [
  "line",
  "phone",
  "sms",
  "email",
  "zoom",
  "google_meet",
  "in_person",
  "other",
] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

// ── Contact results ───────────────────────────────────────────────
export const CONTACT_RESULTS = [
  "connected",
  "no_answer",
  "wrong_number",
  "callback",
  "left_message",
  "inquiry",
  "other",
] as const;
export type ContactResult = (typeof CONTACT_RESULTS)[number];

// ── Age groups ────────────────────────────────────────────────────
export const AGE_GROUPS = [
  "under_10",
  "10_12",
  "13_15",
  "16_18",
  "19_22",
  "23_30",
  "over_30",
] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

// ── Learning needs ────────────────────────────────────────────────
export const LEARNING_NEEDS = [
  "language",
  "academic",
  "summer_camp",
  "winter_camp",
  "study_abroad",
  "short_term",
  "other",
] as const;
export type LearningNeed = (typeof LEARNING_NEEDS)[number];

// ── Student types ─────────────────────────────────────────────────
export const STUDENT_TYPES = [
  "new",
  "returning",
  "referral",
  "transfer",
  "day_student",
  "other",
] as const;
export type StudentType = (typeof STUDENT_TYPES)[number];

// ── Stage event stages ────────────────────────────────────────────
export const STAGE_TYPES = [
  "valid",
  "consult",
  "invite_trial",
  "trial",
] as const;
export type StageType = (typeof STAGE_TYPES)[number];

// ── Campuses ──────────────────────────────────────────────────────
export const CAMPUSES = [
  "cebu",
  "baguio",
  "clark",
  "manila",
  "iloilo",
  "bacolod",
] as const;
export type Campus = (typeof CAMPUSES)[number];

// ── Plans ─────────────────────────────────────────────────────────
export const PLANS = [
  "general_esl",
  "intensive_esl",
  "ielts",
  "business",
] as const;
export type Plan = (typeof PLANS)[number];

// ── Lodging ───────────────────────────────────────────────────────
export const LODGING_TYPES = ["homestay", "dormitory"] as const;
export type LodgingType = (typeof LODGING_TYPES)[number];

// ── Program types ─────────────────────────────────────────────────
export const PROGRAM_TYPES = ["regular", "camp"] as const;
export type ProgramType = (typeof PROGRAM_TYPES)[number];

// ── Attendance ────────────────────────────────────────────────────
export const ATTENDANCE_VALUES = ["pending", "attended", "absent"] as const;
export type Attendance = (typeof ATTENDANCE_VALUES)[number];

// ── Absent reasons ────────────────────────────────────────────────
export const ABSENT_REASONS = [
  "no_response",
  "not_interested",
  "no_show",
  "other",
] as const;
export type AbsentReason = (typeof ABSENT_REASONS)[number];

// ── Source grades ─────────────────────────────────────────────────
export const SOURCE_GRADES = ["A", "B", "C", "庫", "轉", "續&M", ""] as const;
export type SourceGrade = (typeof SOURCE_GRADES)[number];
