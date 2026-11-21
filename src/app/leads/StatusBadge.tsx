"use client";

import { statusGroup, type LeadStatus } from "@/domain/lead-status";

const BG: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-300",
  paused: "bg-warn/20 text-warn",
  closed: "bg-muted/20 text-muted",
  won: "bg-good/20 text-good",
};

export function StatusBadge({
  status,
  label,
}: {
  status: LeadStatus;
  label: string;
}) {
  const group = statusGroup(status);
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium leading-snug ${BG[group]}`}
    >
      {label}
    </span>
  );
}
