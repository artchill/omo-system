import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { listLeads, type LeadListFilter } from "@/db/leads";
import { listSources } from "@/db/sources";
import { listUsers } from "@/db/users";
import { LEAD_STATUSES, type LeadStatus } from "@/domain/lead-status";
import { AGE_GROUPS, LEARNING_NEEDS, STUDENT_TYPES } from "@/domain/enums";
import { Shell } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { LeadFilters } from "./LeadFilters";
import { AddLeadModal } from "./AddLeadModal";
import { StatusBadge } from "./StatusBadge";
import { Pagination } from "./Pagination";

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

  const [t, tc, ts, tAg, tNeed, tSt, tErr] = await Promise.all([
    getTranslations("Leads"),
    getTranslations("Common"),
    getTranslations("LeadStatus"),
    getTranslations("AgeGroup"),
    getTranslations("LearningNeed"),
    getTranslations("StudentType"),
    getTranslations("Errors"),
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

  const pageLabels = {
    prev: tc("prev"),
    next: tc("next"),
    page: tc("page"),
  };

  return (
    <Shell title={t("title")} subtitle={t("subtitle", { count: total })}>
      {/* Top bar: filters + add button */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <LeadFilters
            statuses={statusOptions}
            sources={sources}
            assistants={assistants}
            labels={filterLabels}
          />
        </div>
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

      {/* Table */}
      <div className="glass overflow-hidden">
        {/* Desktop header */}
        <div className="hidden border-b border-edge px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted lg:grid lg:grid-cols-[2fr_1fr_1fr_6rem_5rem_4rem]">
          <span>{t("name")}</span>
          <span>{t("source")}</span>
          <span>{t("assistant")}</span>
          <span>{t("status")}</span>
          <span>{t("contacts")}</span>
          <span />
        </div>

        {rows.map((lead) => (
          <div
            key={lead.id}
            className="flex flex-wrap items-center gap-3 border-b border-edge px-5 py-3 transition-colors hover:bg-white/[0.03] lg:grid lg:grid-cols-[2fr_1fr_1fr_6rem_5rem_4rem]"
          >
            {/* Name column */}
            <div className="min-w-0 flex-1 lg:flex-none">
              <Link
                href={`/leads/${lead.id}`}
                className="font-medium text-foreground hover:text-accent transition-colors"
              >
                {lead.name}
              </Link>
              {lead.phone && (
                <span className="ml-2 text-xs text-muted">{lead.phone}</span>
              )}
            </div>

            {/* Source */}
            <span className="text-sm text-muted">
              {lead.source_name ?? "—"}
            </span>

            {/* Assistant */}
            <span className="text-sm text-muted">
              {lead.assistant_name ?? "—"}
            </span>

            {/* Status */}
            <StatusBadge status={lead.status} label={ts(lead.status)} />

            {/* Contact count */}
            <span className="text-sm text-muted">
              {lead.contact_count}
            </span>

            {/* Detail link */}
            <Link
              href={`/leads/${lead.id}`}
              className="btn btn-ghost p-1"
              title={t("detail")}
            >
              <Icon name="chevronRight" />
            </Link>
          </div>
        ))}

        {rows.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted">
            {t("noLeads")}
          </p>
        )}
      </div>

      <Pagination total={total} pageSize={PAGE_SIZE} labels={pageLabels} />
    </Shell>
  );
}
