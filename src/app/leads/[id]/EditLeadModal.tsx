"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { updateLeadAction } from "../actions";

type Option = { value: string; label: string };

interface Props {
  lead: {
    id: number;
    name: string;
    phone: string;
    email: string;
    line_id: string;
    source_id: number | null;
    sub_source: string;
    assistant_id: number | null;
    sales_id: number | null;
    entry_date: string;
    age_group: string;
    need: string;
    student_type: string;
    expected_depart: string | null;
    expected_weeks: number | null;
    next_contact: string | null;
    note: string;
    lead_note: string;
    season: string;
  };
  sources: Option[];
  assistants: Option[];
  salesUsers: Option[];
  ageGroups: Option[];
  needs: Option[];
  studentTypes: Option[];
  labels: Record<string, string>;
}

export function EditLeadModal({
  lead,
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
    fd.set("id", String(lead.id));
    startTransition(async () => {
      const res = await updateLeadAction(fd);
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
      <button className="btn btn-ghost" onClick={() => setOpen(true)}>
        {labels.edit}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={labels.editTitle}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-bad">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.name} *</span>
              <input name="name" required defaultValue={lead.name} className="field w-full" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.phone}</span>
              <input name="phone" defaultValue={lead.phone} className="field w-full" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.email}</span>
              <input name="email" type="email" defaultValue={lead.email} className="field w-full" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.lineId}</span>
              <input name="line_id" defaultValue={lead.line_id} className="field w-full" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.source}</span>
              <select name="source_id" defaultValue={lead.source_id ?? ""} className="field w-full">
                <option value="">—</option>
                {sources.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.subSource}</span>
              <input name="sub_source" defaultValue={lead.sub_source} className="field w-full" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.assistant}</span>
              <select name="assistant_id" defaultValue={lead.assistant_id ?? ""} className="field w-full">
                <option value="">—</option>
                {assistants.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.sales}</span>
              <select name="sales_id" defaultValue={lead.sales_id ?? ""} className="field w-full">
                <option value="">—</option>
                {salesUsers.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.entryDate}</span>
              <input name="entry_date" type="date" defaultValue={lead.entry_date} className="field w-full" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.ageGroup}</span>
              <select name="age_group" defaultValue={lead.age_group} className="field w-full">
                <option value="">—</option>
                {ageGroups.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.need}</span>
              <select name="need" defaultValue={lead.need} className="field w-full">
                <option value="">—</option>
                {needs.map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.studentType}</span>
              <select name="student_type" defaultValue={lead.student_type} className="field w-full">
                <option value="">—</option>
                {studentTypes.map((st) => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.expectedDepart}</span>
              <input name="expected_depart" type="date" defaultValue={lead.expected_depart ?? ""} className="field w-full" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.expectedWeeks}</span>
              <input name="expected_weeks" type="number" min="1" defaultValue={lead.expected_weeks ?? ""} className="field w-full" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.nextContact}</span>
              <input name="next_contact" type="date" defaultValue={lead.next_contact ?? ""} className="field w-full" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.season}</span>
              <select name="season" defaultValue={lead.season} className="field w-full">
                <option value="">—</option>
                <option value="peak">{labels.seasonPeak}</option>
                <option value="off">{labels.seasonOff}</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-muted">{labels.leadNote}</span>
            <textarea
              name="lead_note"
              rows={2}
              maxLength={500}
              placeholder={labels.leadNotePlaceholder}
              defaultValue={lead.lead_note}
              className="field w-full"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-muted">{labels.note}</span>
            <textarea name="note" rows={2} maxLength={1000} defaultValue={lead.note} className="field w-full" />
          </label>

          <div className="flex items-center justify-end gap-3 border-t border-edge pt-4">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
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
