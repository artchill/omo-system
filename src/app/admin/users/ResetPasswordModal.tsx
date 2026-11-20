"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { resetPasswordAction } from "./actions";

interface Props {
  userId: number;
  userName: string;
  labels: {
    trigger: string;
    title: string;
    password: string;
    submit: string;
    cancel: string;
  };
}

export function ResetPasswordModal({ userId, userName, labels }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost text-xs">
        {labels.trigger}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`${labels.title} — ${userName}`}>
        <form
          action={async (fd) => {
            await resetPasswordAction(fd);
            setOpen(false);
          }}
        >
          <input type="hidden" name="id" value={userId} />
          <div>
            <label htmlFor={`pw-${userId}`} className="mb-1.5 block text-xs font-medium text-muted">
              {labels.password}
            </label>
            <input
              id={`pw-${userId}`}
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
