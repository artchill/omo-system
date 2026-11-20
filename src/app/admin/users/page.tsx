import { getTranslations } from "next-intl/server";
import { Shell } from "@/components/Header";
import { ROLES } from "@/domain/roles";
import { listUsers } from "@/db/users";
import { requirePermission } from "@/lib/auth";
import { isErrorCode } from "@/lib/errors";
import { AddUserModal } from "./AddUserModal";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { updateUserAction } from "./actions";

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
    <div className="size-11 shrink-0 rounded-full bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] flex items-center justify-center font-bold text-sm text-[#04101f] select-none">
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
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[role] ?? "border-edge text-muted bg-glass"}`}
    >
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

  /* Serialisable props for client components */
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

      {/* ── Header row: title + Add button ── */}
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

      {/* ── User cards ── */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {users.map((u) => (
          <div
            key={u.id}
            className={`glass p-5 flex flex-col ${u.active === 1 ? "" : "opacity-50"}`}
          >
            {/* Identity */}
            <div className="flex items-start gap-3 mb-4">
              <Avatar name={u.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[0.95rem] leading-tight">
                    {u.name}
                  </span>
                  {u.id === me.id && (
                    <span className="text-xs text-cyan-400 font-medium">
                      {t("you")}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted mt-0.5 truncate">
                  {u.email}
                </div>
              </div>
            </div>

            {/* Role badge + status */}
            <div className="flex items-center gap-2 mb-4">
              <RoleBadge role={u.role} label={tr(u.role)} />
              {u.active === 1 ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-good">
                  <span className="size-1.5 rounded-full bg-good" />
                  {t("active")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-bad">
                  <span className="size-1.5 rounded-full bg-bad" />
                  {t("inactive")}
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-edge mb-4 mt-auto" />

            {/* Actions row */}
            <form
              action={updateUserAction}
              className="flex flex-wrap items-end gap-3"
            >
              <input type="hidden" name="id" value={u.id} />
              <div className="flex-1 min-w-[7rem]">
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  {t("role")}
                </label>
                <select
                  name="role"
                  defaultValue={u.role}
                  className="field"
                  aria-label={t("role")}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {tr(r)}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm pb-[0.6rem] cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="size-4 accent-cyan-400 rounded"
                  name="active"
                  defaultChecked={u.active === 1}
                />
                {t("active")}
              </label>
              <button type="submit" className="btn btn-ghost text-xs">
                {t("save")}
              </button>
              <ResetPasswordModal
                userId={u.id}
                userName={u.name}
                labels={{
                  trigger: t("resetPassword"),
                  title: t("resetPassword"),
                  password: t("passwordMin"),
                  submit: t("resetPassword"),
                  cancel: t("cancel"),
                }}
              />
            </form>
          </div>
        ))}
      </div>
    </Shell>
  );
}
