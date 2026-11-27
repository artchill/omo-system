import { STAGE_TYPES } from "@/domain/enums";

/**
 * 階段 shown as a colour chip, the same colours on the list and on the lead
 * page so a stage is recognisable at a glance in either place.
 *
 * The four stages are a progression, so the colours run cool to warm rather
 * than being arbitrary.
 */
const TONE: Record<string, string> = {
  valid: "bg-sky-400/15 text-sky-300",
  consult: "bg-blue-400/15 text-blue-300",
  invite_trial: "bg-violet-400/15 text-violet-300",
  trial: "bg-emerald-400/15 text-emerald-300",
};

export function StageChip({
  stage,
  label,
  className = "",
}: {
  stage: string;
  label: string;
  className?: string;
}) {
  const tone = TONE[stage] ?? "bg-white/[0.06] text-muted";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-[0.7rem] font-medium ${tone} ${className}`}
    >
      {label}
    </span>
  );
}

/** Narrows a stored value to a known stage, for translation. */
export function isStage(v: string | null): v is (typeof STAGE_TYPES)[number] {
  return !!v && (STAGE_TYPES as readonly string[]).includes(v);
}
