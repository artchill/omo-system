import { getTranslations } from "next-intl/server";
import { Shell } from "@/components/Header";
import { listUsers } from "@/db/users";
import { can, ROLES } from "@/domain/roles";
import { LEAD_STATUSES, statusGroup, type LeadStatusGroup } from "@/domain/lead-status";
import { requireUser } from "@/lib/auth";

const DOT: Record<LeadStatusGroup, string> = {
  open: "bg-blue-400",
  paused: "bg-warn",
  closed: "bg-slate-500",
  won: "bg-good",
};

export default async function Home() {
  const user = await requireUser();
  const [t, ts, tr] = await Promise.all([
    getTranslations("Home"),
    getTranslations("LeadStatus"),
    getTranslations("Roles"),
  ]);

  const kpis = ["kpiNew", "kpiValid", "kpiConsult", "kpiWon"] as const;
  const groups: LeadStatusGroup[] = ["open", "paused", "closed", "won"];
  const people = can(user.role, "users.manage")
    ? listUsers().filter((u) => u.active === 1)
    : null;

  return (
    <Shell title={t("welcome", { name: user.name })} subtitle={t("subtitle")}>
      <section aria-label={t("kpiTitle")} className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {kpis.map((key) => (
          <div key={key} className="glass p-4 md:p-5">
            <p className="text-sm text-muted">{t(key)}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight md:mt-3 md:text-4xl">—</p>
            <p className="mt-2 text-xs text-muted">{t("kpiWait")}</p>
          </div>
        ))}
      </section>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-3">
        <section className="glass p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold">{t("statusesTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("statusesNote")}</p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {groups.map((group) => (
              <div key={group}>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <span className={`size-2 rounded-full ${DOT[group]}`} aria-hidden="true" />
                  {t(`group.${group}`)}
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {LEAD_STATUSES.filter((s) => statusGroup(s) === group).map((s) => (
                    <li key={s} className="chip">
                      {ts(s)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {people && (
          <section className="glass p-6">
            <h2 className="text-lg font-semibold">{t("teamTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("teamNote", { count: people.length })}</p>
            <ul className="mt-5 space-y-3">
              {ROLES.map((role) => {
                const n = people.filter((p) => p.role === role).length;
                return (
                  <li key={role} className="flex items-center justify-between">
                    <span className="text-sm">{tr(role)}</span>
                    <span className="rounded-lg bg-white/5 px-2.5 py-1 text-sm font-semibold tabular-nums">
                      {n}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </Shell>
  );
}
