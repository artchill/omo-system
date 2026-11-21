"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { updateUserAction, resetPasswordAction } from "./actions";

interface Props {
  user: { id: number; name: string; email: string; role: string; active: number };
  isSelf: boolean;
  labels: {
    edit: string;
    role: string;
    active: string;
    save: string;
    cancel: string;
    resetPassword: string;
    password: string;
  };
  roles: { value: string; label: string }[];
}

export function EditUserModal({ user, isSelf, labels, roles }: Props) {
  const [open, setOpen] = useState(false);
  const [showReset, setShowReset] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setShowReset(false); }}
        className="btn btn-ghost text-xs"
      >
        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
        </svg>
        {labels.edit}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${labels.edit} — ${user.name}`}
      >
        {!showReset ? (
          /* ── Edit role / active ── */
          <form
            action={async (fd) => {
              await updateUserAction(fd);
              setOpen(false);
            }}
          >
            <input type="hidden" name="id" value={user.id} />
            <div className="grid gap-4">
              <div>
                <label htmlFor={`edit-role-${user.id}`} className="mb-1.5 block text-xs font-medium text-muted">
                  {labels.role}
                </label>
                <select
                  id={`edit-role-${user.id}`}
                  name="role"
                  defaultValue={user.role}
                  className="field"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="size-4 accent-cyan-400 rounded"
                  name="active"
                  defaultChecked={user.active === 1}
                />
                {labels.active}
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="text-xs text-warn hover:text-warn/80 underline underline-offset-2 transition-colors"
              >
                {labels.resetPassword}
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
                  {labels.cancel}
                </button>
                <button type="submit" className="btn btn-primary">
                  {labels.save}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* ── Reset password sub-view ── */
          <form
            action={async (fd) => {
              await resetPasswordAction(fd);
              setOpen(false);
            }}
          >
            <input type="hidden" name="id" value={user.id} />
            <div>
              <label htmlFor={`pw-${user.id}`} className="mb-1.5 block text-xs font-medium text-muted">
                {labels.password}
              </label>
              <input
                id={`pw-${user.id}`}
                name="password"
                type="password"
                required
                minLength={10}
                maxLength={200}
                autoComplete="new-password"
                className="field"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowReset(false)} className="btn btn-ghost">
                ← {labels.cancel}
              </button>
              <button type="submit" className="btn btn-primary">
                {labels.resetPassword}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
