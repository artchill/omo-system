import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { can } from "@/domain/roles";
import { getCurrentUser } from "@/lib/auth";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Sidebar, type NavItem } from "./Sidebar";
import { MobileNav } from "./MobileNav";

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
 * Signed in: collapsible sidebar + top bar. Signed out: centred, language switch only.
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

  const sidebarLabels = {
    signOut: t("signOut"),
    collapse: t("collapse"),
    expand: t("expand"),
  };

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <Sidebar
        items={items}
        user={{ name: user.name, role: tr(user.role), initials }}
        labels={sidebarLabels}
        logoutAction={logout}
        langSwitcher={<LanguageSwitcher />}
      />

      {/* Main content */}
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
          {/* Desktop top-right: user chip + lang (lang now in sidebar, user chip stays) */}
          <div className="hidden items-center gap-3 md:flex">
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
          {/* Mobile: language switcher */}
          <div className="md:hidden">
            <LanguageSwitcher />
          </div>
        </header>

        {/* Mobile nav */}
        <div className="mb-5 md:hidden">
          <MobileNav items={items} />
        </div>

        <main className={narrow ? "max-w-3xl" : ""}>{children}</main>

        <form action={logout} className="mt-8 md:hidden">
          <button type="submit" className="btn btn-ghost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-[1.15rem]"><path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9" /></svg>
            {t("signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}
