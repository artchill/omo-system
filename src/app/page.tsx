import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Header } from "@/components/Header";
import { LEAD_STATUSES } from "@/domain/lead-status";
import { requireUser } from "@/lib/auth";

export default async function Home() {
  const user = await requireUser();
  const t = await getTranslations("Home");
  const ts = await getTranslations("LeadStatus");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Header />

      <h1 className="text-2xl font-bold">{t("welcome", { name: user.name })}</h1>
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
