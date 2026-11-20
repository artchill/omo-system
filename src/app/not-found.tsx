import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 opacity-80">{t("body")}</p>
      <p className="mt-6">
        <Link href="/" className="underline">
          {t("home")}
        </Link>
      </p>
    </main>
  );
}
