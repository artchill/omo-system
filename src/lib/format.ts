/**
 * Date and time formatting, pinned to the team's timezone.
 *
 * Why pinned: these helpers run in both server and client components. If the
 * timezone came from the host, a UTC server and a Taipei browser would render
 * different text for the same timestamp and React would report a hydration
 * mismatch. Pinning also keeps dates right once the app runs on a server
 * outside Taiwan — "today" for the team is Taipei's today, not the server's.
 *
 * Display format is YYYY-MM-DD [HH:mm], which matches the dates stored in the
 * database and reads the same in English and Chinese.
 */
export const APP_TIME_ZONE = "Asia/Taipei";

type DateInput = string | number | Date | null | undefined;

function parts(value: DateInput): Record<string, string> {
  if (value === null || value === undefined || value === "") return {};
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return {};

  const out: Record<string, string> = {};
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  for (const p of formatter.formatToParts(d)) out[p.type] = p.value;
  return out;
}

/** "2026-12-01", or the fallback when the value is missing or unparseable. */
export function formatDate(value: DateInput, fallback = "—"): string {
  const p = parts(value);
  return p.year ? `${p.year}-${p.month}-${p.day}` : fallback;
}

/** "2026-12-01 14:30", or the fallback when the value is missing or unparseable. */
export function formatDateTime(value: DateInput, fallback = "—"): string {
  const p = parts(value);
  return p.year ? `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}` : fallback;
}

/**
 * Today in the team's timezone, as YYYY-MM-DD — the default for date fields.
 * Plain `new Date().toISOString()` would give the UTC date, which is still
 * yesterday for anyone working in Taipei before 08:00.
 */
export function todayISO(): string {
  return formatDate(new Date(), "");
}
