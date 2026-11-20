import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { Shell } from "@/components/Header";
import { countUsers } from "@/db/users";
import { getCurrentUser } from "@/lib/auth";
import { login } from "./actions";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  if (countUsers() === 0) redirect("/setup");

  const t = await getTranslations("Auth");
  return (
    <Shell narrow>
      <div className="glass p-8">
        <h1 className="text-2xl font-bold tracking-tight">{t("loginTitle")}</h1>
        <p className="mb-6 mt-1 text-sm text-muted">{t("loginIntro")}</p>
        <AuthForm mode="login" action={login} />
      </div>
    </Shell>
  );
}
