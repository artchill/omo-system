import type { TimelineEntry, TimelineKind } from "@/db/lead-timeline";

type Labels = Record<string, string>;

/**
 * 狀態紀錄 — one continuous history of the lead.
 *
 * Every entry carries a chip saying which kind of change it was, so the
 * stream reads as one record rather than four lists stitched together.
 */
const TONE: Record<TimelineKind, string> = {
  status: "bg-amber-400/15 text-amber-300",
  stage: "bg-violet-400/15 text-violet-300",
  contact: "bg-sky-400/15 text-sky-300",
  invite: "bg-blue-400/15 text-blue-300",
  deal: "bg-emerald-400/15 text-emerald-300",
  edit: "bg-white/[0.07] text-muted",
};

export function RecordFeed({
  entries,
  labels,
  renderWhen,
  describe,
}: {
  entries: TimelineEntry[];
  labels: Labels;
  /** Formats the entry timestamp; the page owns the locale. */
  renderWhen: (at: string) => string;
  /** Turns an entry's codes into the sentence shown under its chip. */
  describe: (entry: TimelineEntry) => string;
}) {
  if (entries.length === 0) {
    return (
      <p className="px-1 py-10 text-center text-sm text-muted">{labels.empty}</p>
    );
  }

  return (
    <ol className="relative space-y-0">
      {entries.map((e, i) => (
        <li key={e.key} className="relative flex gap-3 pb-5">
          {/* Rail: a dot per entry, joined by a line except after the last */}
          <div className="flex flex-col items-center">
            <span
              className={`mt-1.5 size-2 shrink-0 rounded-full ${TONE[e.kind].split(" ")[0]}`}
            />
            {i < entries.length - 1 && (
              <span className="mt-1 w-px flex-1 bg-edge" aria-hidden />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[0.7rem] font-medium ${TONE[e.kind]}`}
              >
                {labels[`kind_${e.kind}`]}
              </span>
              <span className="whitespace-nowrap text-xs tabular-nums text-muted">
                {renderWhen(e.at)}
              </span>
              {e.user_name && (
                <span className="truncate text-xs text-muted">{e.user_name}</span>
              )}
            </div>

            {describe(e) && (
              <p className="text-sm leading-relaxed">{describe(e)}</p>
            )}
            {e.note && (
              <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-muted">
                {e.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
