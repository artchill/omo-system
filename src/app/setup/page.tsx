import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { Shell } from "@/components/Header";
import { countUsers } from "@/db/users";
import { setupAdmin } from "../login/actions";

// Only reachable while the system has no users yet.
export default async function SetupPage() {
  if (countUsers() > 0) redirect("/login");

  const t = await getTranslations("Auth");
  return (
    <Shell narrow>
      <div className="glass p-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("setupTitle")}</h1>
        <p className="mb-6 mt-1 text-sm text-muted">{t("setupIntro")}</p>
        <AuthForm mode="setup" action={setupAdmin} />
      </div>
    </Shell>
  );
}
