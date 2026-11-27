"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { formatDateTime } from "@/lib/format";
import {
  addLeadNoteAction,
  updateLeadNoteAction,
  deleteLeadNoteAction,
} from "../actions";

type Note = {
  id: number;
  body: string;
  created_at: string;
  updated_at: string;
  user_name?: string | null;
};

interface Props {
  leadId: number;
  notes: Note[];
  /** Ids the current user may rewrite — their own, or all for an admin. */
  editableIds: number[];
  labels: Record<string, string>;
}

/**
 * 諮詢筆記 — free text staff write themselves, kept apart from 狀態紀錄,
 * which is assembled from events the system records.
 */
export function ConsultNotes({ leadId, notes, editableIds, labels }: Props) {
  const locale = useLocale();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function add() {
    if (!draft.trim()) return;
    const fd = new FormData();
    fd.set("lead_id", String(leadId));
    fd.set("body", draft);
    startTransition(async () => {
      const res = await addLeadNoteAction(fd);
      if (res && "error" in res && res.error) setError(labels.errGeneric);
      else {
        setDraft("");
        setError("");
      }
    });
  }

  function saveEdit(id: number) {
    const fd = new FormData();
    fd.set("id", String(id));
    fd.set("body", editBody);
    startTransition(async () => {
      const res = await updateLeadNoteAction(fd);
      if (res && "error" in res && res.error) setError(labels.errGeneric);
      else setEditing(null);
    });
  }

  function remove(id: number) {
    const fd = new FormData();
    fd.set("id", String(id));
    startTransition(async () => {
      const res = await deleteLeadNoteAction(fd);
      if (res && "error" in res && res.error) setError(labels.errGeneric);
    });
  }

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-bad">{error}</p>}

      {/* Composer */}
      <div>
        <textarea
          rows={3}
          maxLength={4000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={labels.notePlaceholder}
          className="field w-full"
        />
        <div className="mt-2 flex justify-end">
          <button
            className="btn btn-primary"
            onClick={add}
            disabled={isPending || !draft.trim()}
          >
            {isPending ? labels.saving : labels.noteAdd}
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{labels.noteEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => {
            const canEdit = editableIds.includes(n.id);
            return (
              <li key={n.id} className="rounded-xl border border-edge p-3">
                <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <span className="whitespace-nowrap tabular-nums">
                    {formatDateTime(n.created_at, locale)}
                  </span>
                  {n.user_name && <span className="truncate">{n.user_name}</span>}
                  {n.updated_at !== n.created_at && (
                    <span className="italic">({labels.edited})</span>
                  )}
                  {canEdit && editing !== n.id && (
                    <span className="ml-auto flex gap-2">
                      <button
                        className="transition-colors hover:text-foreground"
                        onClick={() => {
                          setEditing(n.id);
                          setEditBody(n.body);
                        }}
                      >
                        {labels.edit}
                      </button>
                      <button
                        className="transition-colors hover:text-bad"
                        onClick={() => remove(n.id)}
                        disabled={isPending}
                      >
                        {labels.delete}
                      </button>
                    </span>
                  )}
                </div>

                {editing === n.id ? (
                  <div>
                    <textarea
                      rows={3}
                      maxLength={4000}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="field w-full"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        className="btn btn-ghost"
                        onClick={() => setEditing(null)}
                      >
                        {labels.cancel}
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => saveEdit(n.id)}
                        disabled={isPending || !editBody.trim()}
                      >
                        {labels.save}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line text-sm leading-relaxed">
                    {n.body}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
