"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { createLeadAction } from "./actions";

type Option = { value: string; label: string };

interface Props {
  sources: Option[];
  assistants: Option[];
  salesUsers: Option[];
  ageGroups: Option[];
  needs: Option[];
  studentTypes: Option[];
  labels: Record<string, string>;
}

export function AddLeadModal({
  sources,
  assistants,
  salesUsers,
  ageGroups,
  needs,
  studentTypes,
  labels,
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createLeadAction(fd);
      if (res && "error" in res && res.error) {
        setError(labels[`err_${res.error}`] ?? labels.errGeneric);
      } else {
        setOpen(false);
        setError("");
      }
    });
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + {labels.add}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={labels.add}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-bad">{error}</p>}

          {/* Row: name + phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.name} *</span>
              <input name="name" required className="field w-full" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.phone}</span>
              <input name="phone" className="field w-full" />
            </label>
          </div>

          {/* Row: email + LINE */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.email}</span>
              <input name="email" type="email" className="field w-full" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.lineId}</span>
              <input name="line_id" className="field w-full" />
            </label>
          </div>

          {/* Row: source + sub-source */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.source}</span>
              <select name="source_id" className="field w-full">
                <option value="">—</option>
                {sources.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.subSource}</span>
              <input name="sub_source" className="field w-full" />
            </label>
          </div>

          {/* Row: assistant + sales */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.assistant}</span>
              <select name="assistant_id" className="field w-full">
                <option value="">—</option>
                {assistants.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.sales}</span>
              <select name="sales_id" className="field w-full">
                <option value="">—</option>
                {salesUsers.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Row: entry date + age group */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.entryDate}</span>
              <input
                name="entry_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="field w-full"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.ageGroup}</span>
              <select name="age_group" className="field w-full">
                <option value="">—</option>
                {ageGroups.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Row: need + student type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.need}</span>
              <select name="need" className="field w-full">
                <option value="">—</option>
                {needs.map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.studentType}</span>
              <select name="student_type" className="field w-full">
                <option value="">—</option>
                {studentTypes.map((st) => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Row: expected depart + weeks */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.expectedDepart}</span>
              <input name="expected_depart" type="date" className="field w-full" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.expectedWeeks}</span>
              <input name="expected_weeks" type="number" min="1" className="field w-full" />
            </label>
          </div>

          {/* Next contact */}
          <label className="block">
            <span className="mb-1 block text-xs text-muted">{labels.nextContact}</span>
            <input name="next_contact" type="date" className="field w-full" />
          </label>

          {/* Notes */}
          <label className="block">
            <span className="mb-1 block text-xs text-muted">{labels.note}</span>
            <textarea name="note" rows={2} className="field w-full" />
          </label>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-edge pt-4">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setOpen(false)}
            >
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
