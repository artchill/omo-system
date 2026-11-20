import "server-only";
import bundle from "../generated/docs.json";
import { type Locale } from "@/i18n/config";

export type Doc = {
  slug: string;
  title: string;
  order: number;
  body: string;
};

type Bundle = Record<string, Record<string, Doc>>;
const docs = bundle as Bundle;

const SLUG_RE = /^[a-z0-9-]+$/;

/** All guides for a locale, falling back to English per missing guide. */
export function listDocs(locale: Locale): (Doc & { fellBack: boolean })[] {
  const en = docs.en ?? {};
  const own = docs[locale] ?? {};
  return Object.keys(en)
    .map((slug) => {
      const doc = own[slug] ?? en[slug];
      return { ...doc, fellBack: !own[slug] };
    })
    .sort((a, b) => a.order - b.order);
}

/** Look up one guide. The slug is validated; it never touches the filesystem. */
export function getDoc(
  locale: Locale,
  slug: string,
): (Doc & { fellBack: boolean }) | undefined {
  if (!SLUG_RE.test(slug)) return undefined;
  const own = docs[locale]?.[slug];
  if (own) return { ...own, fellBack: false };
  const en = docs.en?.[slug];
  return en ? { ...en, fellBack: true } : undefined;
}
