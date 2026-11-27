"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { todayISO } from "@/lib/format";
import {
  addContactLogAction,
  addStageEventAction,
  addConsultInviteAction,
} from "../actions";

type Option = { value: string; label: string };
type Kind = "contact" | "stage" | "invite";

interface Props {
  leadId: number;
  channels: Option[];
  results: Option[];
  stages: Option[];
  labels: Record<string, string>;
}

/**
 * The single + on 狀態紀錄. One button, one modal: pick what you are
 * recording, fill the few fields that kind needs, save. Everything saved here
 * lands in the feed below, which is assembled from the same tables.
 */
export function AddRecordMenu({ leadId, channels, results, stages, labels }: Props) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("contact");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setError("");
    setKind("contact");
  }

  function submit(fd: FormData) {
    fd.set("lead_id", String(leadId));
    startTransition(async () => {
      const run =
        kind === "contact"
          ? addContactLogAction
          : kind === "stage"
            ? addStageEventAction
            : addConsultInviteAction;
      const res = await run(fd);
      if (res && "error" in res && res.error) setError(labels.errGeneric);
      else close();
    });
  }

  const TABS: { id: Kind; label: string }[] = [
    { id: "contact", label: labels.kindContact },
    { id: "stage", label: labels.kindStage },
    { id: "invite", label: labels.kindInvite },
  ];

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <span aria-hidden>+</span> {labels.add}
      </button>

      <Modal open={open} onClose={close} title={labels.add}>
        <form action={submit} className="space-y-4">
          {error && <p className="text-sm text-bad">{error}</p>}

          <div>
            <span className="mb-2 block text-xs text-muted">{labels.pickType}</span>
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setKind(tab.id)}
                  className={`chip whitespace-nowrap transition-colors ${
                    kind === tab.id
                      ? "bg-accent/20 text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {kind === "contact" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs text-muted">{labels.channel}</span>
                  <select name="channel" className="field w-full" required>
                    {channels.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-muted">{labels.result}</span>
                  <select name="result" className="field w-full" required>
                    {results.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs text-muted">{labels.note}</span>
                <textarea
                  name="note"
                  rows={3}
                  maxLength={1000}
                  placeholder={labels.notePlaceholder}
                  className="field w-full"
                />
              </label>
            </>
          )}

          {kind === "stage" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs text-muted">{labels.stage}</span>
                  <select name="stage" className="field w-full" required>
                    {stages.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-muted">{labels.eventDate}</span>
                  <input
                    name="event_date"
                    type="date"
                    defaultValue={todayISO()}
                    className="field w-full"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs text-muted">{labels.note}</span>
                <textarea name="note" rows={2} maxLength={1000} className="field w-full" />
              </label>
            </>
          )}

          {kind === "invite" && (
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.scheduledAt}</span>
              <input
                name="scheduled_at"
                type="datetime-local"
                className="field w-full"
              />
            </label>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-edge pt-4">
            <button type="button" className="btn btn-ghost" onClick={close}>
              {labels.cancel}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? labels.saving : labels.save}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
