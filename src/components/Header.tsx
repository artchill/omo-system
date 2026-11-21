import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { can } from "@/domain/roles";
import { getCurrentUser } from "@/lib/auth";
import { Icon } from "./Icon";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavLinks, type NavItem } from "./NavLinks";

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-extrabold text-[#04101f] shadow-[0_8px_24px_-8px_rgba(34,211,238,0.7)]"
      >
        O
      </span>
      <span className="text-base font-semibold tracking-tight">OMO</span>
    </Link>
  );
}

/**
 * Page frame used by every page.
 * Signed in: sidebar + top bar. Signed out (login / setup): centred, language switch only.
 * The page itself supplies `title` and its content.
 */
export async function Shell({
  title,
  subtitle,
  narrow = false,
  children,
}: {
  title?: string;
  subtitle?: string;
  narrow?: boolean;
  children: React.ReactNode;
}) {
  const [t, tn, tr, user] = await Promise.all([
    getTranslations("Common"),
    getTranslations("Nav"),
    getTranslations("Roles"),
    getCurrentUser(),
  ]);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col px-4 py-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Brand />
          <LanguageSwitcher />
        </div>
        <main
          className={`mx-auto flex w-full flex-1 flex-col justify-center py-10 ${
            narrow ? "max-w-md" : "max-w-3xl"
          }`}
        >
          {children}
        </main>
      </div>
    );
  }

  const items: NavItem[] = [
    { href: "/", label: tn("dashboard"), icon: "dashboard" },
    { href: "/leads", label: tn("leads"), icon: "leads" },
    { href: "/help", label: tn("help"), icon: "help" },
  ];
  if (can(user.role, "users.manage")) {
    items.push({ href: "/admin/users", label: tn("users"), icon: "users" });
    items.push({ href: "/admin/sources", label: tn("sources"), icon: "sources" });
    items.push({ href: "/admin/settings", label: tn("settings"), icon: "settings" });
    items.push({ href: "/admin/audit", label: tn("auditLog"), icon: "audit" });
  }
  const initials = user.name.trim().slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen md:flex">
      <aside className="glass sticky top-4 m-4 mr-0 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col p-4 md:flex">
        <div className="px-2 pb-6 pt-2">
          <Brand />
        </div>
        <NavLinks items={items} layout="vertical" />
        <form action={logout} className="mt-auto">
          <button type="submit" className="btn btn-ghost w-full justify-start">
            <Icon name="logout" />
            {t("signOut")}
          </button>
        </form>
      </aside>

      <div className="min-w-0 flex-1 px-4 py-4 md:px-8 md:py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl">
                {title}
              </h1>
            )}
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="chip py-1 pl-1 pr-3">
              <span
                aria-hidden="true"
                className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-[0.7rem] font-bold text-[#04101f]"
              >
                {initials}
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-medium">{user.name}</span>
                <span className="block text-[0.7rem] text-muted">{tr(user.role)}</span>
              </span>
            </div>
          </div>
        </header>

        <div className="mb-5 md:hidden">
          <NavLinks items={items} layout="horizontal" />
        </div>

        <main className={narrow ? "max-w-3xl" : ""}>{children}</main>

        <form action={logout} className="mt-8 md:hidden">
          <button type="submit" className="btn btn-ghost">
            <Icon name="logout" />
            {t("signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}
