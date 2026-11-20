/** Supported UI locales. `zh-Hant` is Traditional Chinese (Taiwan terminology). */
export const locales = ["zh-Hant", "en"] as const;
export type Locale = (typeof locales)[number];

/** Used when the user has no saved choice and the browser gives no usable hint. */
export const defaultLocale: Locale = "zh-Hant";

/** Cookie that remembers the visitor's choice (set by the language switcher). */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Allow-list check. Always use this before trusting a locale from outside. */
export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (locales as readonly string[]).includes(value)
  );
}

/**
 * Pick a supported locale from an Accept-Language header.
 * Any Chinese variant maps to zh-Hant (the only Chinese UI we ship).
 */
export function matchAcceptLanguage(
  header: string | null | undefined,
): Locale | undefined {
  if (!header) return undefined;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number(qParam.split("=")[1]) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter(({ tag, q }) => tag && q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const primary = tag.split("-")[0];
    if (primary === "en") return "en";
    if (primary === "zh") return "zh-Hant";
  }
  return undefined;
}
