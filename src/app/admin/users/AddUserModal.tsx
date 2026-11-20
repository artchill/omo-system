"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { createUserAction } from "./actions";

interface Props {
  buttonLabel: string;
  modalTitle: string;
  labels: {
    name: string;
    email: string;
    password: string;
    role: string;
    submit: string;
    cancel: string;
  };
  roles: { value: string; label: string }[];
}

export function AddUserModal({ buttonLabel, modalTitle, labels, roles }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {buttonLabel}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={modalTitle}>
        <form
          action={async (fd) => {
            await createUserAction(fd);
            setOpen(false);
          }}
        >
          <div className="grid gap-4">
            <div>
              <label htmlFor="add-name" className="mb-1.5 block text-xs font-medium text-muted">
                {labels.name}
              </label>
              <input id="add-name" name="name" required maxLength={100} className="field" />
            </div>
            <div>
              <label htmlFor="add-email" className="mb-1.5 block text-xs font-medium text-muted">
                {labels.email}
              </label>
              <input id="add-email" name="email" type="email" required maxLength={254} className="field" />
            </div>
            <div>
              <label htmlFor="add-password" className="mb-1.5 block text-xs font-medium text-muted">
                {labels.password}
              </label>
              <input
                id="add-password"
                name="password"
                type="password"
                required
                minLength={10}
                maxLength={200}
                autoComplete="new-password"
                className="field"
              />
            </div>
            <div>
              <label htmlFor="add-role" className="mb-1.5 block text-xs font-medium text-muted">
                {labels.role}
              </label>
              <select id="add-role" name="role" defaultValue="assistant" className="field">
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
              {labels.cancel}
            </button>
            <button type="submit" className="btn btn-primary">
              {labels.submit}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
