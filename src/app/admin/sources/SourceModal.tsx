"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { createSourceAction, updateSourceAction } from "./actions";

interface SourceData {
  id?: number;
  name: string;
  grade: string;
  active: number;
  sort: number;
}

interface Props {
  source?: SourceData;
  labels: {
    add: string;
    edit: string;
    name: string;
    grade: string;
    active: string;
    sort: string;
    save: string;
    cancel: string;
  };
  grades: string[];
}

export function SourceModal({ source, labels, grades }: Props) {
  const [open, setOpen] = useState(false);
  const isEdit = !!source;

  return (
    <>
      {isEdit ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-ghost text-xs"
        >
          <svg
            className="size-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
            />
          </svg>
          {labels.edit}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn-primary text-sm"
        >
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 5v14M5 12h14"
            />
          </svg>
          {labels.add}
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? `${labels.edit} — ${source.name}` : labels.add}
      >
        <form
          action={async (fd) => {
            const result = isEdit
              ? await updateSourceAction(fd)
              : await createSourceAction(fd);
            if (!result?.error) setOpen(false);
          }}
        >
          {isEdit && <input type="hidden" name="id" value={source.id} />}
          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                {labels.name}
              </label>
              <input
                name="name"
                type="text"
                required
                maxLength={50}
                defaultValue={source?.name ?? ""}
                className="field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                {labels.grade}
              </label>
              <select
                name="grade"
                defaultValue={source?.grade ?? ""}
                className="field"
              >
                <option value="">—</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">
                {labels.sort}
              </label>
              <input
                name="sort"
                type="number"
                defaultValue={source?.sort ?? 0}
                className="field"
              />
            </div>
            {isEdit && (
              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="size-4 accent-cyan-400 rounded"
                  name="active"
                  defaultChecked={source.active === 1}
                />
                {labels.active}
              </label>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-ghost"
            >
              {labels.cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              {labels.save}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
