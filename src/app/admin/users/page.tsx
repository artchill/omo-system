import { getTranslations } from "next-intl/server";
import { Shell } from "@/components/Header";
import { ROLES } from "@/domain/roles";
import { listUsers } from "@/db/users";
import { requirePermission } from "@/lib/auth";
import { isErrorCode } from "@/lib/errors";
import {
  createUserAction,
  resetPasswordAction,
  updateUserAction,
} from "./actions";

const OK_CODES = ["created", "updated", "passwordReset"] as const;
type OkCode = (typeof OK_CODES)[number];

function Avatar({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const dim = size === "lg" ? "size-11" : "size-8";
  const text = size === "lg" ? "text-sm" : "text-xs";
  return (
    <div
      className={`${dim} shrink-0 rounded-full bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] flex items-center justify-center font-bold ${text} text-[#04101f] select-none`}
    >
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

      {/* ── Add user form ── */}
      <section className="glass p-6 mb-6">
        <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] text-[#04101f]">
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </span>
          {t("add")}
        </h2>
        <form action={createUserAction}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="add-name"
                className="mb-1.5 block text-xs font-medium text-muted"
              >
                {t("name")}
              </label>
              <input
                id="add-name"
                name="name"
                required
                maxLength={100}
                className="field"
              />
            </div>
            <div>
              <label
                htmlFor="add-email"
                className="mb-1.5 block text-xs font-medium text-muted"
              >
                {t("email")}
              </label>
              <input
                id="add-email"
                name="email"
                type="email"
                required
                maxLength={254}
                className="field"
              />
            </div>
            <div>
              <label
                htmlFor="add-password"
                className="mb-1.5 block text-xs font-medium text-muted"
              >
                {t("passwordMin")}
              </label>
              <input
                id="add-password"
                name="password"
                type="password"
                required
                minLength={10}
                maxLength={200}
                autoComplete="new-password"
                className="field"
              />
            </div>
            <div>
              <label
                htmlFor="add-role"
                className="mb-1.5 block text-xs font-medium text-muted"
              >
                {t("role")}
              </label>
              <select
                id="add-role"
                name="role"
                defaultValue="assistant"
                className="field"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {tr(r)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-5">
            <button type="submit" className="btn btn-primary">
              {t("addButton")}
            </button>
          </div>
        </form>
      </section>

      {/* ── User list ── */}
      <section>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[var(--glass-strong)] border border-edge">
            <svg
              className="size-4 text-muted"
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
          </span>
          {t("teamMembers")}
        </h2>

        <div className="grid gap-4 lg:grid-cols-2">
          {users.map((u) => (
            <div
              key={u.id}
              className={`glass p-5 ${u.active === 1 ? "" : "opacity-50"}`}
            >
              {/* User identity row */}
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
                  <div className="mt-2">
                    <RoleBadge role={u.role} label={tr(u.role)} />
                    {u.active !== 1 && (
                      <span className="ml-2 inline-flex items-center rounded-full border border-bad/40 bg-bad/10 px-2.5 py-0.5 text-xs font-medium text-bad">
                        {t("inactive")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-edge mb-4" />

              {/* Role & status form */}
              <form
                action={updateUserAction}
                className="flex flex-wrap items-end gap-3 mb-4"
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
                <button type="submit" className="btn btn-ghost">
                  {t("save")}
                </button>
              </form>

              {/* Password reset form */}
              <form
                action={resetPasswordAction}
                className="flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="id" value={u.id} />
                <div className="flex-1 min-w-0">
                  <label className="mb-1.5 block text-xs font-medium text-muted">
                    {t("newPassword")}
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={10}
                    maxLength={200}
                    autoComplete="new-password"
                    className="field"
                  />
                </div>
                <button type="submit" className="btn btn-ghost">
                  {t("resetPassword")}
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
