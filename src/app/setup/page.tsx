import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { Header } from "@/components/Header";
import { countUsers } from "@/db/users";
import { setupAdmin } from "../login/actions";

// Only reachable while the system has no users yet.
export default async function SetupPage() {
  if (countUsers() > 0) redirect("/login");

  const t = await getTranslations("Auth");
  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <Header />
      <h1 className="mb-2 text-2xl font-bold">{t("setupTitle")}</h1>
      <p className="mb-6 text-sm opacity-80">{t("setupIntro")}</p>
      <AuthForm mode="setup" action={setupAdmin} />
    </main>
  );
}
