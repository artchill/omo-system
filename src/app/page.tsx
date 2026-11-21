import { getTranslations } from "next-intl/server";
import { Shell } from "@/components/Header";
import { requireUser } from "@/lib/auth";
import { can } from "@/domain/roles";
import { getSetting } from "@/db/settings";
import { getDashboardMetrics, getAssistantStats } from "@/db/dashboard";
import { LEAD_STATUSES, statusGroup, type LeadStatusGroup } from "@/domain/lead-status";

const DOT: Record<LeadStatusGroup, string> = {
  open: "bg-blue-400",
  paused: "bg-warn",
  closed: "bg-slate-500",
  won: "bg-good",
};

function pct(a: number, b: number): string {
  if (b === 0) return "—";
  return `${((a / b) * 100).toFixed(1)}%`;
}

function usd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default async function Home() {
  const user = await requireUser();
  const [t, ts, td] = await Promise.all([
    getTranslations("Home"),
    getTranslations("LeadStatus"),
    getTranslations("Dashboard"),
  ]);

  // Check dashboard visibility
  const visibility = getSetting("dashboard_visibility") ?? "admin,sales";
  const allowedRoles = visibility.split(",").map((s) => s.trim());
  const canSeeDashboard = allowedRoles.includes(user.role) || can(user.role, "dashboard.view");

  if (!canSeeDashboard) {
    return (
      <Shell title={t("welcome", { name: user.name })} subtitle={t("subtitle")}>
        <div className="glass p-8 text-center">
          <p className="text-muted">{td("noDashboard")}</p>
        </div>
      </Shell>
    );
  }

  const m = getDashboardMetrics();
  const assistants = can(user.role, "dashboard.assistants")
    ? getAssistantStats()
    : null;

  const groups: LeadStatusGroup[] = ["open", "paused", "closed", "won"];

  return (
    <Shell title={t("welcome", { name: user.name })} subtitle={t("subtitle")}>
      {/* KPI cards */}
      <section aria-label={td("title")} className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <div className="glass p-4 md:p-5">
          <p className="text-sm text-muted">{td("newLeads")}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{m.totalLeads}</p>
          <p className="mt-1 text-xs text-muted">
            {m.newLeads} {td("unprocessed")}
          </p>
        </div>
        <div className="glass p-4 md:p-5">
          <p className="text-sm text-muted">{td("valid")}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{m.validLeads}</p>
          <p className="mt-1 text-xs text-muted">{pct(m.validLeads, m.totalLeads)}</p>
        </div>
        <div className="glass p-4 md:p-5">
          <p className="text-sm text-muted">{td("consultations")}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{m.consultInvites}</p>
          <p className="mt-1 text-xs text-muted">
            {m.attended} {td("attended")} · {m.absent} {td("absent")}
          </p>
        </div>
        <div className="glass p-4 md:p-5">
          <p className="text-sm text-muted">{td("deals")}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{m.deals}</p>
          <p className="mt-1 text-xs text-muted">{usd(m.netAmountUsd)} {td("netAmount")}</p>
        </div>
      </section>

      {/* Rates row */}
      <section className="mt-4 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <div className="glass p-4">
          <p className="text-xs text-muted">{td("processRate")}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {pct(m.totalLeads - m.newLeads, m.totalLeads)}
          </p>
        </div>
        <div className="glass p-4">
          <p className="text-xs text-muted">{td("validRate")}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {pct(m.validLeads, m.totalLeads)}
          </p>
        </div>
        <div className="glass p-4">
          <p className="text-xs text-muted">{td("attendRate")}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {pct(m.attended, m.consultInvites)}
          </p>
        </div>
        <div className="glass p-4">
          <p className="text-xs text-muted">{td("dealRate")}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {pct(m.deals, m.validLeads)}
          </p>
        </div>
      </section>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-3">
        {/* Status overview */}
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

        {/* Assistant comparison */}
        {assistants && assistants.length > 0 && (
          <section className="glass p-6">
            <h2 className="text-lg font-semibold">{td("assistantComparison")}</h2>
            <div className="mt-4 space-y-3">
              {assistants.map((a) => (
                <div key={a.userId} className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">{a.name}</span>
                  <div className="flex gap-3 text-xs tabular-nums">
                    <span className="text-muted">{a.assigned} {td("assigned")}</span>
                    <span className="text-accent">{a.valid} {td("valid")}</span>
                    <span className="text-good">{a.deals} {td("deals")}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}
