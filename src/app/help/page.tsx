import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Shell } from "@/components/Header";
import type { Locale } from "@/i18n/config";
import { requireUser } from "@/lib/auth";
import { listDocs } from "@/lib/docs";

export default async function HelpIndex() {
  await requireUser();
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("Help");
  const docs = listDocs(locale);

  return (
    <Shell title={t("title")} subtitle={t("intro")} narrow>
      <ul className="grid gap-3">
        {docs.map((doc) => (
          <li key={doc.slug}>
            <Link
              href={`/help/${doc.slug}`}
              className="glass flex items-center justify-between p-5 transition-colors hover:bg-white/[0.07]"
            >
              <span className="font-medium">{doc.title}</span>
              {doc.fellBack && (
                <span className="chip text-xs text-muted">EN</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
