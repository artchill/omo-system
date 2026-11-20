import { getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
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

const field = "rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm";
const button =
  "rounded-md border border-foreground/20 px-3 py-1 text-sm hover:bg-foreground/10";

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
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <Header />
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-red-500/50 p-3 text-sm text-red-500">
          {te(error)}
        </p>
      )}
      {okCode && (
        <p role="status" className="mt-4 rounded-md border border-foreground/20 p-3 text-sm">
          {t(`ok.${okCode}`)}
        </p>
      )}

      <section className="mt-6 rounded-md border border-foreground/20 p-4">
        <h2 className="mb-3 font-semibold">{t("add")}</h2>
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
            <button type="submit" className={button}>
              {t("addButton")}
            </button>
          </div>
        </form>
      </section>

      <ul className="mt-6 space-y-3">
        {users.map((u) => (
          <li key={u.id} className="rounded-md border border-foreground/20 p-4">
            <div className="mb-3">
              <span className="font-medium">{u.name}</span>
              {u.id === me.id && <span className="ml-2 text-xs opacity-70">{t("you")}</span>}
              <div className="text-sm opacity-70">{u.email}</div>
            </div>

            <form action={updateUserAction} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={u.id} />
              <select name="role" defaultValue={u.role} className={field} aria-label={t("role")}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {tr(r)}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={u.active === 1} />
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
                className={field}
              />
              <button type="submit" className={button}>
                {t("resetPassword")}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
