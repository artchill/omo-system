import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Locale } from "@/i18n/config";
import { listDocs } from "@/lib/docs";

export default async function HelpIndex() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("Help");
  const tc = await getTranslations("Common");
  const docs = listDocs(locale);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold">
          {tc("appName")}
        </Link>
        <LanguageSwitcher />
      </header>

      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 opacity-80">{t("intro")}</p>

      <ul className="mt-6 space-y-2">
        {docs.map((doc) => (
          <li key={doc.slug}>
            <Link href={`/help/${doc.slug}`} className="underline">
              {doc.title}
            </Link>
            {doc.fellBack && (
              <span className="ml-2 text-xs opacity-60">EN</span>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
