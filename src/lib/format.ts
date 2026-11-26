/**
 * Date and time formatting, pinned to the team's timezone.
 *
 * Why pinned: these helpers run in both server and client components. If the
 * timezone came from the host, a UTC server and a Taipei browser would render
 * different text for the same timestamp and React would report a hydration
 * mismatch. Pinning also keeps dates right once the app runs on a server
 * outside Taiwan — "today" for the team is Taipei's today, not the server's.
 *
 * Two families of function, deliberately separate:
 *   - toISODate / todayISO  → YYYY-MM-DD for <input type="date"> and the DB
 *   - formatDateTime / formatDate → text for people to read, in their locale
 */
export const APP_TIME_ZONE = "Asia/Taipei";

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function partsOf(d: Date, options: Intl.DateTimeFormatOptions, locale?: string) {
  const out: Record<string, string> = {};
  const formatter = new Intl.DateTimeFormat(locale ?? "en-CA", {
    timeZone: APP_TIME_ZONE,
    ...options,
  });
  for (const p of formatter.formatToParts(d)) out[p.type] = p.value;
  return out;
}

/** "2026-12-01" — the machine format, for date inputs and database columns. */
export function toISODate(value: DateInput, fallback = ""): string {
  const d = toDate(value);
  if (!d) return fallback;
  const p = partsOf(d, { year: "numeric", month: "2-digit", day: "2-digit" });
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Today in the team's timezone, as YYYY-MM-DD — the default for date fields.
 * Plain `new Date().toISOString()` would give the UTC date, which is still
 * yesterday for anyone working in Taipei before 08:00.
 */
export function todayISO(): string {
  return toISODate(new Date());
}

/**
 * A timestamp as people read it, in their own locale:
 *   en      → "November 27, 2026 at 12:30:45 AM"
 *   zh-Hant → "2026年11月27日 上午12:30:45"
 *
 * Pass the locale from `useLocale()` in a client component or `getLocale()`
 * on the server. It is required rather than defaulted so a call site cannot
 * quietly render Chinese text inside the English UI.
 */
export function formatDateTime(
  value: DateInput,
  locale: string,
  fallback = "—",
): string {
  const d = toDate(value);
  if (!d) return fallback;
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * The same, without the time:
 *   en      → "November 27, 2026"
 *   zh-Hant → "2026年11月27日"
 */
export function formatDate(
  value: DateInput,
  locale: string,
  fallback = "—",
): string {
  const d = toDate(value);
  if (!d) return fallback;
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}
