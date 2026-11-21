"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { addStageEventAction } from "../actions";

type StageEntry = {
  id: number;
  stage: string;
  event_date: string;
  note: string;
  created_at: string;
  user_name: string;
};

type Option = { value: string; label: string };

interface Props {
  leadId: number;
  stages: StageEntry[];
  stageTypes: Option[];
  labels: Record<string, string>;
}

export function StageTab({ leadId, stages, stageTypes, labels }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("lead_id", String(leadId));
    startTransition(async () => {
      const res = await addStageEventAction(fd);
      if (res && "error" in res && res.error) setError(labels.errGeneric);
      else { setOpen(false); setError(""); }
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{labels.title}</h3>
        <button className="btn btn-primary text-sm" onClick={() => setOpen(true)}>
          + {labels.add}
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={labels.add}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-bad">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.stage} *</span>
              <select name="stage" required className="field w-full">
                <option value="">—</option>
                {stageTypes.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.eventDate}</span>
              <input
                name="event_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="field w-full"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">{labels.note}</span>
            <textarea name="note" rows={2} className="field w-full" />
          </label>
          <div className="flex justify-end gap-3 border-t border-edge pt-4">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              {labels.cancel}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {labels.save}
            </button>
          </div>
        </form>
      </Modal>

      {stages.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{labels.noData}</p>
      ) : (
        <div className="space-y-2">
          {stages.map((s) => (
            <div key={s.id} className="glass flex items-start gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip text-xs">{labels[`st_${s.stage}`] ?? s.stage}</span>
                  <span className="text-xs text-muted">{s.event_date}</span>
                  <span className="text-xs text-muted">{labels.by} {s.user_name}</span>
                </div>
                {s.note && <p className="mt-1 text-sm text-muted">{s.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
