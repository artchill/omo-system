import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Locale } from "@/i18n/config";
import { getDoc } from "@/lib/docs";

export default async function HelpDoc({ params }: PageProps<"/help/[slug]">) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const doc = getDoc(locale, slug);
  if (!doc) notFound();

  const t = await getTranslations("Help");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <Link href="/help" className="underline">
          ← {t("back")}
        </Link>
        <LanguageSwitcher />
      </header>

      {doc.fellBack && (
        <p className="mb-4 rounded-md border border-foreground/20 p-3 text-sm">
          {t("notTranslated")}
        </p>
      )}

      {/* Raw HTML in markdown is NOT rendered (react-markdown default). */}
      <article
        lang={doc.fellBack ? "en" : locale}
        className="space-y-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_table]:border-collapse [&_td]:border [&_td]:border-foreground/20 [&_td]:px-2 [&_th]:border [&_th]:border-foreground/20 [&_th]:px-2 [&_a]:underline"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.body}</ReactMarkdown>
      </article>
    </main>
  );
}
