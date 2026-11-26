"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { Modal } from "@/components/Modal";
import { addConsultInviteAction, updateAttendanceAction } from "../actions";
import { formatDateTime } from "@/lib/format";

type InviteEntry = {
  id: number;
  scheduled_at: string | null;
  attendance: string;
  absent_reason: string;
  created_at: string;
  inviter_name: string;
};

interface Props {
  leadId: number;
  invites: InviteEntry[];
  labels: Record<string, string>;
}

export function ConsultInviteTab({ leadId, invites, labels }: Props) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("lead_id", String(leadId));
    startTransition(async () => {
      await addConsultInviteAction(fd);
      setOpen(false);
    });
  }

  function handleAttendance(inviteId: number, attendance: string, reason?: string) {
    const fd = new FormData();
    fd.set("id", String(inviteId));
    fd.set("lead_id", String(leadId));
    fd.set("attendance", attendance);
    if (reason) fd.set("absent_reason", reason);
    startTransition(async () => { await updateAttendanceAction(fd); });
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
        <form onSubmit={handleAdd} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs text-muted">{labels.scheduledAt}</span>
            <input name="scheduled_at" type="datetime-local" className="field w-full" />
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

      {invites.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{labels.noData}</p>
      ) : (
        <div className="space-y-2">
          {invites.map((inv) => (
            <div key={inv.id} className="glass p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm tabular-nums">
                  {inv.scheduled_at
                    ? formatDateTime(inv.scheduled_at, locale)
                    : labels.noSchedule}
                </span>
                <span className="text-xs text-muted">{labels.by} {inv.inviter_name}</span>

                {/* Attendance badge */}
                <span
                  className={`chip text-xs ${
                    inv.attendance === "attended"
                      ? "bg-good/20 text-good"
                      : inv.attendance === "absent"
                        ? "bg-bad/20 text-bad"
                        : ""
                  }`}
                >
                  {labels[`att_${inv.attendance}`] ?? inv.attendance}
                </span>

                {inv.absent_reason && (
                  <span className="text-xs text-muted">
                    ({labels[`ar_${inv.absent_reason}`] ?? inv.absent_reason})
                  </span>
                )}
              </div>

              {/* Action buttons for pending */}
              {inv.attendance === "pending" && (
                <div className="mt-2 flex gap-2">
                  <button
                    className="btn btn-ghost text-xs text-good"
                    onClick={() => handleAttendance(inv.id, "attended")}
                    disabled={isPending}
                  >
                    ✓ {labels.attended}
                  </button>
                  <button
                    className="btn btn-ghost text-xs text-bad"
                    onClick={() => {
                      const reason = prompt(labels.absentReason);
                      handleAttendance(inv.id, "absent", reason ?? "no_response");
                    }}
                    disabled={isPending}
                  >
                    ✗ {labels.absent}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
