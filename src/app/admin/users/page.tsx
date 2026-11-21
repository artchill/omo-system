import { getTranslations } from "next-intl/server";
import { Shell } from "@/components/Header";
import { ROLES } from "@/domain/roles";
import { listUsers } from "@/db/users";
import { requirePermission } from "@/lib/auth";
import { isErrorCode } from "@/lib/errors";
import { AddUserModal } from "./AddUserModal";
import { EditUserModal } from "./EditUserModal";

const OK_CODES = ["created", "updated", "passwordReset"] as const;
type OkCode = (typeof OK_CODES)[number];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="size-9 shrink-0 rounded-full bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] flex items-center justify-center font-bold text-xs text-[#04101f] select-none">
      {initials}
    </div>
  );
}

function RoleBadge({ role, label }: { role: string; label: string }) {
  const colors: Record<string, string> = {
    admin: "border-cyan-400/40 text-cyan-300 bg-cyan-400/10",
    sales: "border-blue-400/40 text-blue-300 bg-blue-400/10",
    assistant: "border-violet-400/40 text-violet-300 bg-violet-400/10",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium leading-none ${colors[role] ?? "border-edge text-muted bg-glass"}`}
    >
      {label}
    </span>
  );
}

function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${active ? "text-good" : "text-bad"}`}
    >
      <span
        className={`size-1.5 rounded-full ${active ? "bg-good" : "bg-bad"}`}
      />
      {label}
    </span>
  );
}

export default async function UsersPage({
  searchParams,
}: PageProps<"/admin/users">) {
  const me = await requirePermission("users.manage");
  const { e, ok } = await searchParams;

  const [t, te, tr] = await Promise.all([
    getTranslations("Users"),
    getTranslations("Errors"),
    getTranslations("Roles"),
  ]);
  const error = typeof e === "string" && isErrorCode(e) ? e : null;
  const okCode =
    typeof ok === "string" && (OK_CODES as readonly string[]).includes(ok)
      ? (ok as OkCode)
      : null;
  const users = listUsers();

  const roleOptions = ROLES.map((r) => ({ value: r, label: tr(r) }));

  return (
    <Shell
      title={t("title")}
      subtitle={t("subtitle", { count: users.length })}
    >
      {/* ── Alerts ── */}
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad"
        >
          {te(error)}
        </p>
      )}
      {okCode && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-good/40 bg-good/10 px-4 py-3 text-sm text-good"
        >
          {t(`ok.${okCode}`)}
        </p>
      )}

      {/* ── Header row ── */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <svg
            className="size-5 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {t("teamMembers")}
        </h2>

        <AddUserModal
          buttonLabel={t("add")}
          modalTitle={t("add")}
          labels={{
            name: t("name"),
            email: t("email"),
            password: t("passwordMin"),
            role: t("role"),
            submit: t("addButton"),
            cancel: t("cancel"),
          }}
          roles={roleOptions}
        />
      </div>

      {/* ── User table ── */}
      <div className="glass overflow-hidden">
        {/* Column headers — hidden on mobile */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_8rem_6rem_5rem] items-center gap-4 border-b border-edge px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">
          <span>{t("name")}</span>
          <span>{t("role")}</span>
          <span>{t("active")}</span>
          <span className="text-right">{t("edit")}</span>
        </div>

        {/* Rows */}
        {users.map((u, i) => (
          <div
            key={u.id}
            className={`grid grid-cols-1 sm:grid-cols-[1fr_8rem_6rem_5rem] items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-white/[0.03] ${i > 0 ? "border-t border-edge/50" : ""} ${u.active === 1 ? "" : "opacity-50"}`}
          >
            {/* Name + email */}
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={u.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{u.name}</span>
                  {u.id === me.id && (
                    <span className="shrink-0 text-[0.65rem] text-cyan-400 font-medium">
                      {t("you")}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted truncate">{u.email}</div>
              </div>
            </div>

            {/* Role badge */}
            <div className="sm:justify-self-start">
              <RoleBadge role={u.role} label={tr(u.role)} />
            </div>

            {/* Status */}
            <div>
              <StatusDot
                active={u.active === 1}
                label={u.active === 1 ? t("active") : t("inactive")}
              />
            </div>

            {/* Edit button */}
            <div className="sm:justify-self-end">
              <EditUserModal
                user={{
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  role: u.role,
                  active: u.active,
                }}
                isSelf={u.id === me.id}
                labels={{
                  edit: t("edit"),
                  role: t("role"),
                  active: t("active"),
                  save: t("save"),
                  cancel: t("cancel"),
                  resetPassword: t("resetPassword"),
                  password: t("passwordMin"),
                }}
                roles={roleOptions}
              />
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
