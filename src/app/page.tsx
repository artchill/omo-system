import { useTranslations } from "next-intl";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LEAD_STATUSES } from "@/domain/lead-status";

export default function Home() {
  const t = useTranslations("Home");
  const tc = useTranslations("Common");
  const ts = useTranslations("LeadStatus");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <span className="font-semibold">{tc("appName")}</span>
        <LanguageSwitcher />
      </header>

      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 opacity-80">{t("subtitle")}</p>

      <h2 className="mt-8 text-lg font-semibold">{t("statusesTitle")}</h2>
      <p className="mt-1 text-sm opacity-70">{t("statusesNote")}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {LEAD_STATUSES.map((code) => (
          <li
            key={code}
            className="rounded-full border border-foreground/20 px-3 py-1 text-sm"
          >
            {ts(code)}
          </li>
        ))}
      </ul>

      <p className="mt-8">
        <Link href="/help" className="underline">
          {t("helpLink")}
        </Link>
      </p>
    </main>
  );
}
