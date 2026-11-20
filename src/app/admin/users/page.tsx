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

const field = "field";
const button = "btn btn-ghost";

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
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
    <Shell title={t("title")} subtitle={t("subtitle", { count: users.length })}>

      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
          {te(error)}
        </p>
      )}
      {okCode && (
        <p role="status" className="mb-4 rounded-xl border border-good/40 bg-good/10 px-4 py-3 text-sm text-good">
          {t(`ok.${okCode}`)}
        </p>
      )}

      <section className="glass p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("add")}</h2>
        <form action={createUserAction} className="grid gap-3 sm:grid-cols-2">
          <input name="name" required maxLength={100} placeholder={t("name")} className={field} />
          <input name="email" type="email" required maxLength={254} placeholder={t("email")} className={field} />
          <input
            name="password"
            type="password"
            required
            minLength={10}
            maxLength={200}
            autoComplete="new-password"
            placeholder={t("passwordMin")}
            className={field}
          />
          <select name="role" defaultValue="assistant" className={field}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {tr(r)}
              </option>
            ))}
          </select>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">
              {t("addButton")}
            </button>
          </div>
        </form>
      </section>

      <ul className="mt-4 grid gap-4 lg:grid-cols-2">
        {users.map((u) => (
          <li key={u.id} className={`glass p-5 ${u.active === 1 ? "" : "opacity-60"}`}>
            <div className="mb-3">
              <span className="font-medium">{u.name}</span>
              {u.id === me.id && <span className="ml-2 text-xs text-muted">{t("you")}</span>}
              <div className="text-sm text-muted">{u.email}</div>
            </div>

            <form action={updateUserAction} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={u.id} />
              <select name="role" defaultValue={u.role} className="field !w-auto" aria-label={t("role")}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {tr(r)}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-cyan-400" name="active" defaultChecked={u.active === 1} />
                {t("active")}
              </label>
              <button type="submit" className={button}>
                {t("save")}
              </button>
            </form>

            <form action={resetPasswordAction} className="mt-3 flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={u.id} />
              <input
                name="password"
                type="password"
                required
                minLength={10}
                maxLength={200}
                autoComplete="new-password"
                placeholder={t("newPassword")}
                className="field !w-auto min-w-0 flex-1"
              />
              <button type="submit" className={button}>
                {t("resetPassword")}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
