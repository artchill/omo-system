import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Shell } from "@/components/Header";
import type { Locale } from "@/i18n/config";
import { requireUser } from "@/lib/auth";
import { getDoc } from "@/lib/docs";

export default async function HelpDoc({ params }: PageProps<"/help/[slug]">) {
  await requireUser();
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const doc = getDoc(locale, slug);
  if (!doc) notFound();

  const t = await getTranslations("Help");

  return (
    <Shell narrow>
      <p className="mb-4">
        <Link href="/help" className="text-sm text-muted hover:text-foreground">
          ← {t("back")}
        </Link>
      </p>

      {doc.fellBack && (
        <p className="mb-4 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">
          {t("notTranslated")}
        </p>
      )}

      {/* Raw HTML in markdown is NOT rendered (react-markdown default). */}
      <article lang={doc.fellBack ? "en" : locale} className="glass prose-omo p-7">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.body}</ReactMarkdown>
      </article>
    </Shell>
  );
}
