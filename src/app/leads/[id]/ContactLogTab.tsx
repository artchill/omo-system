"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { addContactLogAction } from "../actions";
import { formatDateTime } from "@/lib/format";

type LogEntry = {
  id: number;
  channel: string;
  result: string;
  note: string;
  logged_at: string;
  user_name: string;
};

type Option = { value: string; label: string };

interface Props {
  leadId: number;
  logs: LogEntry[];
  channels: Option[];
  results: Option[];
  labels: Record<string, string>;
}

export function ContactLogTab({ leadId, logs, channels, results, labels }: Props) {
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

      {/* Contact log list */}
      {logs.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{labels.noData}</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="glass flex items-start gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip text-xs">{labels[`ch_${log.channel}`] ?? log.channel}</span>
                  <span className="chip text-xs">{labels[`cr_${log.result}`] ?? log.result}</span>
                  <span className="text-xs text-muted">
                    {labels.by} {log.user_name}
                  </span>
                </div>
                {log.note && (
                  <p className="mt-1 text-sm text-muted">{log.note}</p>
                )}
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-muted">
                {formatDateTime(log.logged_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
