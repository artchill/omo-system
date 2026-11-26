"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import type { LeadStatus } from "@/domain/lead-status";

type Option = { value: string; label: string };

interface Props {
  statuses: { value: LeadStatus; label: string }[];
  sources: Option[];
  assistants: Option[];
  seasons: Option[];
  labels: {
    search: string;
    status: string;
    source: string;
    assistant: string;
    season: string;
    all: string;
    filter: string;
  };
}

export function LeadFilters({ statuses, sources, assistants, seasons, labels }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page"); // reset pagination
      startTransition(() => router.push(`/leads?${params.toString()}`));
    },
    [searchParams, router],
  );

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        type="search"
        placeholder={labels.search + "…"}
        defaultValue={searchParams.get("q") ?? ""}
        className="field w-full"
        onChange={(e) => {
          clearTimeout((window as unknown as Record<string, ReturnType<typeof setTimeout>>).__leadSearch);
          (window as unknown as Record<string, ReturnType<typeof setTimeout>>).__leadSearch = setTimeout(
            () => update("q", e.target.value),
            350,
          );
        }}
      />

      {/* Filter row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status filter */}
        <select
          className="field w-full"
          value={searchParams.get("status") ?? ""}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="">{labels.all} {labels.status.toLowerCase()}</option>
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Source filter */}
        <select
          className="field w-full"
          value={searchParams.get("source") ?? ""}
          onChange={(e) => update("source", e.target.value)}
        >
          <option value="">{labels.all} {labels.source.toLowerCase()}</option>
          {sources.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Assistant filter */}
        {assistants.length > 0 && (
          <select
            className="field w-full"
            value={searchParams.get("assistant") ?? ""}
            onChange={(e) => update("assistant", e.target.value)}
          >
            <option value="">{labels.all} {labels.assistant.toLowerCase()}</option>
            {assistants.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        )}

        {/* Season filter */}
        <select
          className="field w-full"
          value={searchParams.get("season") ?? ""}
          onChange={(e) => update("season", e.target.value)}
        >
          <option value="">{labels.all} {labels.season.toLowerCase()}</option>
          {seasons.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
