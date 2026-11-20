import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { can } from "@/domain/roles";
import { getCurrentUser } from "@/lib/auth";
import { LanguageSwitcher } from "./LanguageSwitcher";

/** Top bar shown on every page. Menu items appear only if the role allows them. */
export async function Header() {
  const [t, tr, user] = await Promise.all([
    getTranslations("Common"),
    getTranslations("Roles"),
    getCurrentUser(),
  ]);

  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <nav className="flex items-center gap-4">
        <Link href="/" className="font-semibold">
          {t("appName")}
        </Link>
        {user && (
          <>
            <Link href="/help" className="text-sm underline-offset-2 hover:underline">
              {t("help")}
            </Link>
            {can(user.role, "users.manage") && (
              <Link
                href="/admin/users"
                className="text-sm underline-offset-2 hover:underline"
              >
                {t("users")}
              </Link>
            )}
          </>
        )}
      </nav>

      <div className="flex items-center gap-3">
        {user && (
          <span className="text-sm opacity-80">
            {user.name} · {tr(user.role)}
          </span>
        )}
        <LanguageSwitcher />
        {user && (
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-foreground/20 px-3 py-1 text-sm hover:bg-foreground/10"
            >
              {t("signOut")}
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
