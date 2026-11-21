import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { listLeads, type LeadListFilter } from "@/db/leads";
import { listSources } from "@/db/sources";
import { listUsers } from "@/db/users";
import { LEAD_STATUSES, type LeadStatus } from "@/domain/lead-status";
import { AGE_GROUPS, LEARNING_NEEDS, STUDENT_TYPES, CONTACT_CHANNELS, CONTACT_RESULTS } from "@/domain/enums";
import { Shell } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { LeadFilters } from "./LeadFilters";
import { AddLeadModal } from "./AddLeadModal";
import { StatusBadge } from "./StatusBadge";
import { Pagination } from "./Pagination";
import { QuickContactModal } from "./QuickContactModal";

const PAGE_SIZE = 30;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requirePermission("leads.view");
  void user;

  const sp = await searchParams;
  const qPage = parseInt(String(sp.page ?? "1"), 10);
  const qSearch = String(sp.q ?? "");
  const qStatus = String(sp.status ?? "") as LeadStatus | "";
  const qSource = parseInt(String(sp.source ?? ""), 10) || undefined;
  const qAssistant = parseInt(String(sp.assistant ?? ""), 10) || undefined;

  const filter: LeadListFilter = {
    limit: PAGE_SIZE,
    offset: (qPage - 1) * PAGE_SIZE,
  };
  if (qSearch) filter.search = qSearch;
  if (qStatus && LEAD_STATUSES.includes(qStatus as LeadStatus))
    filter.status = qStatus as LeadStatus;
  if (qSource) filter.sourceId = qSource;
  if (qAssistant) filter.assistantId = qAssistant;

  const { rows, total } = listLeads(filter);

  const [t, tc, ts, tAg, tNeed, tSt, tErr, tCh, tCr, tCl, tStage] = await Promise.all([
    getTranslations("Leads"),
    getTranslations("Common"),
    getTranslations("LeadStatus"),
    getTranslations("AgeGroup"),
    getTranslations("LearningNeed"),
    getTranslations("StudentType"),
    getTranslations("Errors"),
    getTranslations("Channel"),
    getTranslations("ContactResult"),
    getTranslations("ContactLog"),
    getTranslations("Stage"),
  ]);

  const sources = listSources(false).map((s) => ({
    value: String(s.id),
    label: s.name,
  }));
  const allUsers = listUsers();
  const assistants = allUsers
    .filter((u) => u.active && (u.role === "assistant" || u.role === "admin"))
    .map((u) => ({ value: String(u.id), label: u.name }));
  const salesUsers = allUsers
    .filter((u) => u.active && (u.role === "sales" || u.role === "admin"))
    .map((u) => ({ value: String(u.id), label: u.name }));

  const statusOptions = LEAD_STATUSES.map((s) => ({
    value: s,
    label: ts(s),
  }));

  const ageGroupOptions = AGE_GROUPS.map((a) => ({ value: a, label: tAg(a) }));
  const needOptions = LEARNING_NEEDS.map((n) => ({ value: n, label: tNeed(n) }));
  const studentTypeOptions = STUDENT_TYPES.map((s) => ({
    value: s,
    label: tSt(s),
  }));

  const addLabels = {
    add: t("add"),
    name: t("name"),
    phone: t("phone"),
    email: t("email"),
    lineId: t("lineId"),
    source: t("source"),
    subSource: t("subSource"),
    assistant: t("assistant"),
    sales: t("sales"),
    entryDate: t("entryDate"),
    ageGroup: t("ageGroup"),
    need: t("need"),
    studentType: t("studentType"),
    expectedDepart: t("expectedDepart"),
    expectedWeeks: t("expectedWeeks"),
    nextContact: t("nextContact"),
    note: t("note"),
    save: tc("save"),
    saving: tc("loading"),
    cancel: tc("cancel"),
    err_name: tErr("name"),
    errGeneric: tErr("generic"),
  };

  const filterLabels = {
    search: tc("search"),
    status: t("status"),
    source: t("source"),
    assistant: t("assistant"),
    all: tc("all"),
    filter: tc("filter"),
  };

  const channelOptions = CONTACT_CHANNELS.map((c) => ({ value: c, label: tCh(c) }));
  const resultOptions = CONTACT_RESULTS.map((r) => ({ value: r, label: tCr(r) }));

  const contactLabels: Record<string, string> = {
    add: tCl("add"),
    channel: tCl("channel"),
    result: tCl("result"),
    note: tCl("note"),
    loggedTime: tCl("loggedTime"),
    notePlaceholder: tCl("notePlaceholder"),
    save: tc("save"),
    cancel: tc("cancel"),
    errGeneric: tErr("generic"),
  };

  const pageLabels = {
    prev: tc("prev"),
    next: tc("next"),
    page: tc("page", { page: "{page}", total: "{total}" }),
  };

  return (
    <Shell title={t("title")} subtitle={t("subtitle", { count: total })}>
      {/* Top bar: filters + add button */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <LeadFilters
            statuses={statusOptions}
            sources={sources}
            assistants={assistants}
            labels={filterLabels}
          />
        </div>
        <div className="flex-shrink-0">
          <AddLeadModal
            sources={sources}
            assistants={assistants}
            salesUsers={salesUsers}
            ageGroups={ageGroupOptions}
            needs={needOptions}
            studentTypes={studentTypeOptions}
            labels={addLabels}
          />
        </div>
      </div>

      {/* ── Desktop table (xl+) ─────────────────────────────── */}
      <div className="glass hidden overflow-hidden xl:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs font-medium uppercase tracking-wider text-muted">
                <th className="whitespace-nowrap px-5 py-3.5">{t("name")}</th>
                <th className="whitespace-nowrap px-4 py-3.5">{t("phone")}</th>
                <th className="whitespace-nowrap px-4 py-3.5">{t("lineId")}</th>
                <th className="whitespace-nowrap px-4 py-3.5">{t("email")}</th>
                <th className="whitespace-nowrap px-4 py-3.5">{t("source")}</th>
                <th className="whitespace-nowrap px-4 py-3.5">{t("status")}</th>
                <th className="whitespace-nowrap px-4 py-3.5">{t("stages")}</th>
                <th className="whitespace-nowrap px-4 py-3.5">{t("contacts")}</th>
                <th className="w-10 px-3 py-3.5"><span className="sr-only">Detail</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {rows.map((lead) => (
                <tr
                  key={lead.id}
                  className="group transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-foreground transition-colors group-hover:text-accent"
                    >
                      {lead.name}
                    </Link>
                  </td>
                  <td className="max-w-[10rem] truncate px-4 py-3.5 text-muted">
                    {lead.phone || "—"}
                  </td>
                  <td className="max-w-[8rem] truncate px-4 py-3.5 text-muted">
                    {lead.line_id || "—"}
                  </td>
                  <td className="max-w-[14rem] truncate px-4 py-3.5 text-muted">
                    {lead.email || "—"}
                  </td>
                  <td className="max-w-[10rem] truncate px-4 py-3.5 text-muted">
                    {lead.source_name ?? "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={lead.status} label={ts(lead.status)} />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted">
                    {lead.latest_stage
                      ? tStage(lead.latest_stage as "valid" | "consult" | "invite_trial" | "trial")
                      : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="tabular-nums text-muted">{lead.contact_count}</span>
                      <QuickContactModal
                        leadId={lead.id}
                        leadName={lead.name}
                        channels={channelOptions}
                        results={resultOptions}
                        labels={contactLabels}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="inline-flex rounded-md p-1 text-muted transition-colors hover:bg-white/10 hover:text-foreground"
                      title={t("detail")}
                    >
                      <Icon name="chevronRight" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-muted">
            {t("noLeads")}
          </p>
        )}
      </div>

      {/* ── Card layout (< xl) ──────────────────────────────── */}
      <div className="space-y-3 xl:hidden">
        {rows.map((lead) => (
          <Link
            key={lead.id}
            href={`/leads/${lead.id}`}
            className="glass group block transition-all hover:ring-1 hover:ring-accent/30"
          >
            <div className="p-4">
              {/* Row 1: Name + Status */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="min-w-0 text-[0.95rem] font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
                  {lead.name}
                </h3>
                <StatusBadge status={lead.status} label={ts(lead.status)} />
              </div>

              {/* Row 2: Contact details — 2-col grid */}
              <div className="mb-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
                {lead.phone && (
                  <div className="flex items-center gap-2 truncate text-muted">
                    <svg className="size-3.5 shrink-0 text-muted/60" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="truncate">{lead.phone}</span>
                  </div>
                )}
                {lead.line_id && (
                  <div className="flex items-center gap-2 truncate text-muted">
                    <span className="shrink-0 text-[0.6rem] font-bold leading-none text-muted/60">LINE</span>
                    <span className="truncate">{lead.line_id}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-2 truncate text-muted sm:col-span-2">
                    <svg className="size-3.5 shrink-0 text-muted/60" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
              </div>

              {/* Row 3: Metadata chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {lead.source_name && (
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-muted">
                    {lead.source_name}
                  </span>
                )}
                {lead.latest_stage && (
                  <span className="rounded-md bg-accent/10 px-2 py-0.5 text-blue-300">
                    {tStage(lead.latest_stage as "valid" | "consult" | "invite_trial" | "trial")}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1.5 text-muted">
                  <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767A2 2 0 009.828 17h2.344l2.828 2.828V17h1a2 2 0 002-2v-4a2 2 0 00-2-2h-1z" />
                  </svg>
                  <span className="tabular-nums">{lead.contact_count}</span>
                  <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <QuickContactModal
                      leadId={lead.id}
                      leadName={lead.name}
                      channels={channelOptions}
                      results={resultOptions}
                      labels={contactLabels}
                    />
                  </span>
                </span>
              </div>
            </div>
          </Link>
        ))}

        {rows.length === 0 && (
          <div className="glass px-5 py-12 text-center text-sm text-muted">
            {t("noLeads")}
          </div>
        )}
      </div>

      <Pagination total={total} pageSize={PAGE_SIZE} labels={pageLabels} />
    </Shell>
  );
}
