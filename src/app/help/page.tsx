import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Header } from "@/components/Header";
import type { Locale } from "@/i18n/config";
import { requireUser } from "@/lib/auth";
import { listDocs } from "@/lib/docs";

export default async function HelpIndex() {
  await requireUser();
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("Help");
  const docs = listDocs(locale);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Header />

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
