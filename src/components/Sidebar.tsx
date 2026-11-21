"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

/* ── Types ────────────────────────────────────────────────── */

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  disabled?: boolean;
  hint?: string;
};

interface SidebarProps {
  items: NavItem[];
  user: { name: string; role: string; initials: string };
  labels: { signOut: string; collapse: string; expand: string };
  logoutAction: () => void;
  langSwitcher: React.ReactNode;
}

/* ── Component ────────────────────────────────────────────── */

export function Sidebar({ items, user, labels, logoutAction, langSwitcher }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  /* Ctrl+B / ⌘B keyboard shortcut */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggle();
      }
    }
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <aside
      className="sidebar-glass sticky top-4 m-4 mr-0 hidden h-[calc(100vh-2rem)] shrink-0 flex-col md:flex"
      style={{ width: collapsed ? 72 : 256 }}
    >
      {/* Brand + collapse toggle */}
      <div className="relative flex items-center px-4 pb-5 pt-5">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-extrabold text-[#04101f] shadow-[0_8px_24px_-8px_rgba(34,211,238,0.7)]"
          >
            O
          </span>
          <span className={`sidebar-label text-base font-semibold tracking-tight ${collapsed ? "sidebar-label-hidden" : ""}`}>
            OMO
          </span>
        </Link>

        {/* Collapse button — positioned half-outside the sidebar */}
        <button
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? labels.expand : labels.collapse}
          aria-keyshortcuts="Meta+B"
          className="absolute -right-3.5 top-7 z-10 grid size-7 place-items-center rounded-full border border-white/20 bg-[#141c2e] text-blue-300 shadow-lg shadow-black/40 transition-all hover:border-blue-400/50 hover:bg-[#1a2540] hover:text-blue-200 hover:shadow-blue-500/20"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3.5 transition-transform duration-300"
            style={{ transform: collapsed ? "rotate(180deg)" : undefined }}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-2.5 overflow-hidden">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          if (item.disabled) {
            return (
              <span
                key={item.href}
                aria-disabled="true"
                className="sidebar-nav-item cursor-default text-muted/70"
                title={collapsed ? item.label : undefined}
              >
                <Icon name={item.icon} className="size-[1.15rem] shrink-0" />
                <span className={`sidebar-label ${collapsed ? "sidebar-label-hidden" : ""}`}>
                  {item.label}
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={`sidebar-nav-item ${
                active
                  ? "bg-gradient-to-r from-blue-500/25 to-cyan-400/10 text-white shadow-[inset_0_0_0_1px_rgba(96,165,250,0.35)]"
                  : "text-muted hover:bg-white/[0.06] hover:text-foreground"
              }`}
            >
              <Icon name={item.icon} className="size-[1.15rem] shrink-0" />
              <span className={`sidebar-label ${collapsed ? "sidebar-label-hidden" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: language + user + logout */}
      <div className="mt-auto space-y-3 px-2.5 pb-4">
        {/* Language switcher — hide in collapsed */}
        <div className={`sidebar-label overflow-hidden ${collapsed ? "sidebar-label-hidden" : ""}`}>
          {langSwitcher}
        </div>

        {/* Divider */}
        <div className="border-t border-edge" />

        {/* User */}
        <div className="flex items-center gap-3 overflow-hidden rounded-xl px-2 py-2">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-[0.65rem] font-bold text-[#04101f]"
          >
            {user.initials}
          </span>
          <span className={`sidebar-label min-w-0 leading-tight ${collapsed ? "sidebar-label-hidden" : ""}`}>
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block truncate text-[0.7rem] text-muted">{user.role}</span>
          </span>
        </div>

        {/* Sign out */}
        <form action={logoutAction}>
          <button
            type="submit"
            title={collapsed ? labels.signOut : undefined}
            className="sidebar-nav-item w-full text-muted hover:bg-white/[0.06] hover:text-foreground"
          >
            <Icon name="logout" className="size-[1.15rem] shrink-0" />
            <span className={`sidebar-label ${collapsed ? "sidebar-label-hidden" : ""}`}>
              {labels.signOut}
            </span>
          </button>
        </form>
      </div>
    </aside>
  );
}
