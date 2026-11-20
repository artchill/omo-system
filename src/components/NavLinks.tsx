"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Shown but not clickable yet; `hint` explains why. */
  disabled?: boolean;
  hint?: string;
};

/** Sidebar (vertical) on desktop, scrolling pill row (horizontal) on mobile. */
export function NavLinks({
  items,
  layout,
}: {
  items: NavItem[];
  layout: "vertical" | "horizontal";
}) {
  const pathname = usePathname();
  const vertical = layout === "vertical";

  return (
    <nav
      className={
        vertical
          ? "flex flex-col gap-1"
          : "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]"
      }
    >
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const base = `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
          vertical ? "" : "shrink-0 whitespace-nowrap"
        }`;

        if (item.disabled) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              className={`${base} cursor-default text-muted/70`}
            >
              <Icon name={item.icon} />
              {item.label}
              {item.hint && (
                <span className="ml-auto rounded-full border border-edge px-2 py-0.5 text-[0.65rem] text-muted">
                  {item.hint}
                </span>
              )}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${base} ${
              active
                ? "bg-gradient-to-r from-blue-500/25 to-cyan-400/10 text-white shadow-[inset_0_0_0_1px_rgba(96,165,250,0.35)]"
                : "text-muted hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <Icon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
