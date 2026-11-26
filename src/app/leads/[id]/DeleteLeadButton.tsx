"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { softDeleteLeadAction } from "../actions";

interface Props {
  leadId: number;
  leadName: string;
  labels: Record<string, string>;
}

export function DeleteLeadButton({ leadId, leadName, labels }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", String(leadId));
    startTransition(async () => {
      const res = await softDeleteLeadAction(fd);
      if (res && "error" in res && res.error) {
        setError(labels.errGeneric);
      } else {
        setOpen(false);
        router.push("/leads");
      }
    });
  }

  return (
    <>
      <button
        className="btn btn-ghost text-bad hover:bg-bad/10"
        onClick={() => setOpen(true)}
      >
        {labels.delete}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${labels.delete} — ${leadName}`}
      >
        <div className="space-y-4">
          {error && <p className="text-sm text-bad">{error}</p>}

          <p className="text-sm text-muted">{labels.deleteConfirm}</p>

          <div className="flex items-center justify-end gap-3 border-t border-edge pt-4">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setOpen(false)}
            >
              {labels.cancel}
            </button>
            <button
              type="button"
              className="btn bg-bad text-white hover:bg-bad/90"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? labels.saving : labels.delete}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
