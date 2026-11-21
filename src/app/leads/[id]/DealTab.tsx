"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { registerDealAction } from "../actions";

type DealEntry = {
  id: number;
  deal_date: string;
  plan: string;
  campus: string;
  lodging: string;
  program_type: string;
  depart_date: string | null;
  return_date: string | null;
  weeks: number | null;
  quote_usd: number | null;
  fx_rate: number | null;
  amount_twd: number | null;
  reg_fee_usd: number;
  commission_rate: number;
  net_usd: number | null;
  net_twd: number | null;
  paid_currency: string;
  paid_amount: number | null;
  key_points: string;
  note: string;
};

type Option = { value: string; label: string };

interface Props {
  leadId: number;
  deals: DealEntry[];
  plans: Option[];
  campuses: Option[];
  canEditFinancials: boolean;
  defaults: { regFee: number; rateNormal: number; rateCamp: number; rateDay: number };
  labels: Record<string, string>;
}

export function DealTab({
  leadId,
  deals,
  plans,
  campuses,
  canEditFinancials,
  defaults,
  labels,
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("lead_id", String(leadId));
    startTransition(async () => {
      const res = await registerDealAction(fd);
      if (res && "error" in res && res.error) {
        setError(labels.errGeneric);
      } else {
        if (res.seasonWarning) setWarning(labels[`sw_${res.seasonWarning}`] ?? "");
        setOpen(false);
        setError("");
      }
    });
  }

  const fmt = (n: number | null) =>
    n != null ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{labels.title}</h3>
        <button className="btn btn-primary text-sm" onClick={() => setOpen(true)}>
          + {labels.add}
        </button>
      </div>

      {warning && (
        <div className="mb-4 glass border-warn/30 bg-warn/10 p-3 text-sm text-warn">
          ⚠ {warning}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={labels.add}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-bad">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.dealDate}</span>
              <input
                name="deal_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="field w-full"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.programType}</span>
              <select name="program_type" className="field w-full">
                <option value="regular">{labels.regular}</option>
                <option value="camp">{labels.camp}</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.plan}</span>
              <select name="plan" className="field w-full">
                <option value="">—</option>
                {plans.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.campus}</span>
              <select name="campus" className="field w-full">
                <option value="">—</option>
                {campuses.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.lodging}</span>
              <select name="lodging" className="field w-full">
                <option value="">—</option>
                <option value="homestay">{labels.homestay}</option>
                <option value="dormitory">{labels.dormitory}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.weeks}</span>
              <input name="weeks" type="number" min="1" className="field w-full" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.departDate}</span>
              <input name="depart_date" type="date" className="field w-full" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">{labels.returnDate}</span>
              <input name="return_date" type="date" className="field w-full" />
            </label>
          </div>

          {/* Financial fields */}
          <div className="border-t border-edge pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-muted">{labels.quoteUsd}</span>
                <input name="quote_usd" type="number" step="0.01" className="field w-full" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted">{labels.fxRate}</span>
                <input name="fx_rate" type="number" step="0.01" className="field w-full" />
              </label>
            </div>

            {canEditFinancials && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs text-muted">{labels.regFeeUsd}</span>
                  <input
                    name="reg_fee_usd"
                    type="number"
                    step="0.01"
                    defaultValue={defaults.regFee}
                    className="field w-full"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-muted">{labels.commissionRate}</span>
                  <input
                    name="commission_rate"
                    type="number"
                    step="0.01"
                    defaultValue={defaults.rateNormal}
                    className="field w-full"
                  />
                </label>
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-muted">{labels.paidCurrency}</span>
                <select name="paid_currency" className="field w-full" defaultValue="TWD">
                  <option value="TWD">TWD</option>
                  <option value="USD">USD</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted">{labels.paidAmount}</span>
                <input name="paid_amount" type="number" step="0.01" className="field w-full" />
              </label>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-muted">{labels.keyPoints}</span>
            <textarea name="key_points" rows={2} className="field w-full" />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-muted">{labels.note}</span>
            <textarea name="note" rows={2} className="field w-full" />
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

      {/* Deal list */}
      {deals.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{labels.noDeals}</p>
      ) : (
        <div className="space-y-3">
          {deals.map((d) => (
            <div key={d.id} className="glass p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-medium">{d.deal_date}</span>
                    <span className="chip text-xs">{labels[`pt_${d.program_type}`] ?? d.program_type}</span>
                    {d.plan && <span className="chip text-xs">{d.plan}</span>}
                    {d.campus && <span className="chip text-xs">{d.campus}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <div>
                      <span className="text-xs text-muted">{labels.quoteUsd}</span>
                      <p>{fmt(d.quote_usd)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted">{labels.netUsd}</span>
                      <p className="text-good">{fmt(d.net_usd)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted">{labels.commissionRate}</span>
                      <p>{(d.commission_rate * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted">{labels.netTwd}</span>
                      <p>{fmt(d.net_twd)}</p>
                    </div>
                  </div>
                  {d.key_points && (
                    <p className="mt-2 text-sm text-muted">{d.key_points}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
