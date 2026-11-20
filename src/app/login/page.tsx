import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { Header } from "@/components/Header";
import { countUsers } from "@/db/users";
import { getCurrentUser } from "@/lib/auth";
import { login } from "./actions";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  if (countUsers() === 0) redirect("/setup");

  const t = await getTranslations("Auth");
  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <Header />
      <h1 className="mb-6 text-2xl font-bold">{t("loginTitle")}</h1>
      <AuthForm mode="login" action={login} />
    </main>
  );
}
