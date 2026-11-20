import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Shell } from "@/components/Header";

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <Shell narrow>
      <div className="glass p-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted">{t("body")}</p>
        <Link href="/" className="btn btn-primary mt-6">
          {t("home")}
        </Link>
      </div>
    </Shell>
  );
}
