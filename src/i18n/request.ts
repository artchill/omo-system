import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import en from "../../messages/en.json";
import zhHant from "../../messages/zh-Hant.json";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  matchAcceptLanguage,
  type Locale,
} from "./config";

// Static imports (not dynamic) so the bundle works on Cloudflare Workers,
// which have no filesystem at runtime.
type Messages = typeof en;
const catalogs: Record<Locale, Messages> = { en, "zh-Hant": zhHant };

type Json = { [key: string]: Json | string };

/** Fill any key missing from `override` with the English text. */
function withEnglishFallback(base: Json, override: Json): Json {
  const result: Json = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = base[key];
    result[key] =
      typeof value === "object" && typeof baseValue === "object"
        ? withEnglishFallback(baseValue, value)
        : value;
  }
  return result;
}

/**
 * Locale priority:
 *  1. (later, once login exists) the signed-in user's saved preference
 *  2. the NEXT_LOCALE cookie set by the language switcher
 *  3. the browser's Accept-Language header
 *  4. defaultLocale (zh-Hant)
 */
async function resolveLocale(): Promise<Locale> {
  const cookieValue = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieValue)) return cookieValue;

  const fromHeader = matchAcceptLanguage(
    (await headers()).get("accept-language"),
  );
  return fromHeader ?? defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  const messages =
    locale === "en"
      ? en
      : (withEnglishFallback(en, catalogs[locale]) as Messages);
  return { locale, messages };
});
