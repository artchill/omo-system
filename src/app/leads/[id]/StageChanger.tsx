"use client";

import { useState, useTransition } from "react";
import { addStageEventAction } from "../actions";

interface Props {
  leadId: number;
  /** The lead's most recent stage, or null when none has been recorded. */
  current: string | null;
  stages: { value: string; label: string }[];
  label: string;
}

/**
 * Records a stage from the top of the lead page, beside the status control.
 * Each pick appends a stage event dated today; the Stages tab keeps the full
 * history and is still the place to back-date one or attach a note.
 */
export function StageChanger({ leadId, current, stages, label }: Props) {
  const [value, setValue] = useState(current ?? "");
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (!next || next === value) return; // "—" is a placeholder, not a stage
    setValue(next);
    const fd = new FormData();
    fd.set("lead_id", String(leadId));
    fd.set("stage", next);
    startTransition(async () => {
      await addStageEventAction(fd);
    });
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
        <option value="">—</option>
        {stages.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}
