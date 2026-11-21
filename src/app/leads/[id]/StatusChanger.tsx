"use client";

import { useState, useTransition } from "react";
import { changeStatusAction } from "../actions";
import type { LeadStatus } from "@/domain/lead-status";

interface Props {
  leadId: number;
  current: LeadStatus;
  statuses: { value: LeadStatus; label: string }[];
  label: string;
}

export function StatusChanger({ leadId, current, statuses, label }: Props) {
  const [value, setValue] = useState(current);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as LeadStatus;
    setValue(newStatus);
    const fd = new FormData();
    fd.set("id", String(leadId));
    fd.set("status", newStatus);
    startTransition(async () => { await changeStatusAction(fd); });
  }

  return (
    <label className="flex items-center gap-2">
      <span className="text-xs text-muted">{label}</span>
      <select
        className="field text-sm"
        value={value}
        onChange={handleChange}
        disabled={isPending}
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}
