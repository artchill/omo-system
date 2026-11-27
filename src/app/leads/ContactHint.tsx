"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  /** Label and value pairs, already translated. Empty values are dropped. */
  rows: { label: string; value: string }[];
  /** Shown when the lead has no contact record yet. */
  emptyLabel: string;
  title: string;
}

/**
 * The "i" on the lead list: hovering shows the most recent 聯繫紀錄 and when
 * it happened.
 *
 * The panel is portalled to <body> and positioned fixed on purpose. The table
 * it sits in is a horizontal scroll container, which clips on both axes, so a
 * normally positioned panel would be cut off at the row or column edge.
 */
export function ContactHint({ rows, emptyLabel, title }: Props) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const filled = rows.filter((r) => r.value);

  function show(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const width = 260;
    // Keep the panel on screen when the icon sits near the right edge.
    const x = Math.min(r.left, window.innerWidth - width - 12);
    setAt({ x: Math.max(12, x), y: r.bottom + 6 });
  }

  return (
    <>
      <button
        type="button"
        aria-label={title}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-edge text-[0.65rem] font-semibold text-muted transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={() => setAt(null)}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={() => setAt(null)}
        // The list rows are links; hovering the hint should not follow them.
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        i
      </button>

      {at &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: "fixed", left: at.x, top: at.y, width: 260 }}
            className="z-50 rounded-xl border border-edge bg-[#0b1120] p-3 text-xs shadow-xl"
          >
            <p className="mb-2 text-[0.65rem] uppercase tracking-wider text-muted">
              {title}
            </p>
            {filled.length === 0 ? (
              <p className="text-muted">{emptyLabel}</p>
            ) : (
              <dl className="space-y-1.5">
                {filled.map((r) => (
                  <div key={r.label} className="flex gap-2">
                    <dt className="w-16 shrink-0 text-muted">{r.label}</dt>
                    <dd className="min-w-0 flex-1 break-words">{r.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
