"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { addContactLogAction } from "./actions";

type Option = { value: string; label: string };

interface Props {
  leadId: number;
  leadName: string;
  channels: Option[];
  results: Option[];
  labels: Record<string, string>;
}

export function QuickContactModal({ leadId, leadName, channels, results, labels }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("lead_id", String(leadId));
    startTransition(async () => {
      const res = await addContactLogAction(fd);
      if (res && "error" in res && res.error) {
        setError(labels.errGeneric);
      } else {
        setOpen(false);
        setError("");
      }
    });
  }

  return (
    <>
      <button
        className="btn btn-ghost p-1 text-muted hover:text-accent"
        title={labels.add}
        onClick={() => setOpen(true)}
      >
        <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`${labels.add} — ${leadName}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-bad">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.channel}</span>
              <select name="channel" required className="field w-full">
                <option value="">—</option>
                {channels.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.result}</span>
              <select name="result" className="field w-full">
                <option value="">—</option>
                {results.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">{labels.loggedTime}</span>
            <input type="datetime-local" name="logged_time" className="field w-full" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted">{labels.note}</span>
            <textarea name="note" rows={2} className="field w-full" placeholder={labels.notePlaceholder} />
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
    </>
  );
}
