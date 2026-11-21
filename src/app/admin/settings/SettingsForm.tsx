"use client";

import { useState, useTransition } from "react";
import { saveSettingsAction } from "./actions";

interface Props {
  settings: Record<string, string>;
  labels: Record<string, string>;
}

export function SettingsForm({ settings, labels }: Props) {
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await saveSettingsAction(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saved && (
        <div className="glass border-good/30 bg-good/10 p-3 text-sm text-good">
          ✓ {labels.saved}
        </div>
      )}

      {/* Peak months */}
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{labels.peakMonths}</span>
        <input
          name="peak_months"
          defaultValue={settings.peak_months ?? "1,2,7,8"}
          className="field w-full max-w-sm"
          placeholder="1,2,7,8"
        />
        <span className="mt-1 block text-xs text-muted">Comma-separated month numbers (1–12)</span>
      </label>

      {/* Countdown days */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{labels.countdownNew}</span>
          <input
            name="countdown_new"
            type="number"
            min="1"
            defaultValue={settings.countdown_new ?? "3"}
            className="field w-full"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{labels.countdownGrace}</span>
          <input
            name="countdown_grace"
            type="number"
            min="1"
            defaultValue={settings.countdown_grace ?? "1"}
            className="field w-full"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{labels.countdownActive}</span>
          <input
            name="countdown_active"
            type="number"
            min="1"
            defaultValue={settings.countdown_active ?? "10"}
            className="field w-full"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{labels.countdownConsult}</span>
          <input
            name="countdown_consult"
            type="number"
            min="1"
            defaultValue={settings.countdown_consult ?? "30"}
            className="field w-full"
          />
        </label>
      </div>

      {/* Commission defaults */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{labels.defaultRegFee}</span>
          <input
            name="default_reg_fee"
            type="number"
            step="0.01"
            defaultValue={settings.default_reg_fee ?? "100"}
            className="field w-full"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{labels.defaultRateNormal}</span>
          <input
            name="default_rate_normal"
            type="number"
            step="0.01"
            defaultValue={settings.default_rate_normal ?? "0.35"}
            className="field w-full"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{labels.defaultRateCamp}</span>
          <input
            name="default_rate_camp"
            type="number"
            step="0.01"
            defaultValue={settings.default_rate_camp ?? "0.25"}
            className="field w-full"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{labels.defaultRateDay}</span>
          <input
            name="default_rate_day"
            type="number"
            step="0.01"
            defaultValue={settings.default_rate_day ?? "0.20"}
            className="field w-full"
          />
        </label>
      </div>

      {/* Dashboard visibility */}
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{labels.dashboardVisibility}</span>
        <input
          name="dashboard_visibility"
          defaultValue={settings.dashboard_visibility ?? "admin,sales"}
          className="field w-full max-w-sm"
          placeholder="admin,sales"
        />
        <span className="mt-1 block text-xs text-muted">Comma-separated roles</span>
      </label>

      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? "…" : labels.save}
      </button>
    </form>
  );
}
