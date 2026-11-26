import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { can } from "@/domain/roles";
import { findLeadById } from "@/db/leads";
import { listContactLogs } from "@/db/contact-logs";
import { listStageEvents } from "@/db/stage-events";
import { listConsultInvites } from "@/db/consult-invites";
import { listDealsByLead } from "@/db/deals";
import { listSources } from "@/db/sources";
import { listUsers } from "@/db/users";
import { getCommissionDefaults } from "@/db/settings";
import { LEAD_STATUSES } from "@/domain/lead-status";
import {
  AGE_GROUPS,
  LEARNING_NEEDS,
  STUDENT_TYPES,
  CONTACT_CHANNELS,
  CONTACT_RESULTS,
  STAGE_TYPES,
  PLANS,
  CAMPUSES,
} from "@/domain/enums";
import { Shell } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "../StatusBadge";
import { EditLeadModal } from "./EditLeadModal";
import { DeleteLeadButton } from "./DeleteLeadButton";
import { StatusChanger } from "./StatusChanger";
import { StageChanger } from "./StageChanger";
import { DetailTabs } from "./DetailTabs";
import { ContactLogTab } from "./ContactLogTab";
import { StageTab } from "./StageTab";
import { ConsultInviteTab } from "./ConsultInviteTab";
import { DealTab } from "./DealTab";

type PageProps = { params: Promise<{ id: string }> };

export default async function LeadDetailPage({ params }: PageProps) {
  const user = await requirePermission("leads.view");
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  const lead = findLeadById(id);
  if (!lead) return notFound();

  const [
    t, tc, ts, tCh, tCr, tSt, tCi, tD, tAg, tNeed, tStType, tPlan, tCampus, tErr, tCl,
  ] = await Promise.all([
    getTranslations("Leads"),
    getTranslations("Common"),
    getTranslations("LeadStatus"),
    getTranslations("Channel"),
    getTranslations("ContactResult"),
    getTranslations("Stage"),
    getTranslations("ConsultInvite"),
    getTranslations("Deals"),
    getTranslations("AgeGroup"),
    getTranslations("LearningNeed"),
    getTranslations("StudentType"),
    getTranslations("Plan"),
    getTranslations("Campus"),
    getTranslations("Errors"),
    getTranslations("ContactLog"),
  ]);

  const contactLogs = listContactLogs(id);
  const stageEvents = listStageEvents(id);
  const consultInvites = listConsultInvites(id);
  const deals = listDealsByLead(id);

  const sources = listSources(false).map((s) => ({
    value: String(s.id),
    label: s.name,
  }));
  const allUsers = listUsers();
  const tUsers = await getTranslations("Users");

  /**
   * Active users holding one of the roles, plus whoever is already assigned.
   * Without that second part, assigning someone who is later deactivated or
   * given a different role would drop them from the options, and the next save
   * of any field on this lead would silently clear the assignment.
   */
  const pickable = (roles: string[], assignedId: number | null) =>
    allUsers
      .filter((u) => (u.active && roles.includes(u.role)) || u.id === assignedId)
      .map((u) => ({
        value: String(u.id),
        label: u.active ? u.name : `${u.name} (${tUsers("inactive")})`,
      }));

  const assistants = pickable(["assistant", "admin"], lead.assistant_id);
  const salesUsers = pickable(["sales", "admin"], lead.sales_id);

  const statusOptions = LEAD_STATUSES.map((s) => ({
    value: s,
    label: ts(s),
  }));
  const ageGroupOptions = AGE_GROUPS.map((a) => ({ value: a, label: tAg(a) }));
  const needOptions = LEARNING_NEEDS.map((n) => ({ value: n, label: tNeed(n) }));
  const studentTypeOptions = STUDENT_TYPES.map((s) => ({
    value: s,
    label: tStType(s),
  }));
  const stageOptions = STAGE_TYPES.map((s) => ({ value: s, label: tSt(s) }));

  const editLabels: Record<string, string> = {
    edit: tc("edit"),
    editTitle: `${tc("edit")} — ${lead.name}`,
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
    leadNote: t("leadNote"),
    leadNotePlaceholder: t("leadNotePlaceholder"),
    season: t("season.label"),
    seasonPeak: t("season.peak"),
    seasonOff: t("season.off"),
    save: tc("save"),
    saving: tc("loading"),
    cancel: tc("cancel"),
    errGeneric: tErr("generic"),
  };

  const deleteLabels: Record<string, string> = {
    delete: t("softDelete"),
    deleteConfirm: t("softDeleteConfirm"),
    cancel: tc("cancel"),
    saving: tc("loading"),
    errGeneric: tErr("generic"),
  };

  // Contact log labels
  const contactLabels: Record<string, string> = {
    title: t("contacts"),
    add: tCl("add"),
    channel: tCl("channel"),
    result: tCl("result"),
    note: tCl("note"),
    by: tCl("by"),
    loggedTime: tCl("loggedTime"),
    notePlaceholder: tCl("notePlaceholder"),
    save: tc("save"),
    cancel: tc("cancel"),
    noData: tc("noData"),
    errGeneric: tErr("generic"),
  };
  // Add channel labels
  for (const ch of CONTACT_CHANNELS) contactLabels[`ch_${ch}`] = tCh(ch);
  // Add result labels
  for (const cr of CONTACT_RESULTS) contactLabels[`cr_${cr}`] = tCr(cr);

  // Stage labels
  const stageLabels: Record<string, string> = {
    title: t("stages"),
    add: tSt("add"),
    stage: t("stages"),
    eventDate: tSt("eventDate"),
    note: tSt("note"),
    by: "—",
    save: tc("save"),
    cancel: tc("cancel"),
    noData: tc("noData"),
    errGeneric: tErr("generic"),
  };
  for (const st of STAGE_TYPES) stageLabels[`st_${st}`] = tSt(st);

  // Consult invite labels
  const inviteLabels: Record<string, string> = {
    title: t("invites"),
    add: tCi("add"),
    scheduledAt: tCi("scheduledAt"),
    by: "—",
    save: tc("save"),
    cancel: tc("cancel"),
    noData: tc("noData"),
    noSchedule: "—",
    attended: tCi("attended"),
    absent: tCi("absent"),
    absentReason: tCi("absentReason"),
    att_pending: tCi("pending"),
    att_attended: tCi("attended"),
    att_absent: tCi("absent"),
    ar_no_response: tCi("no_response"),
    ar_not_interested: tCi("not_interested"),
    ar_no_show: tCi("no_show"),
    ar_other: tCi("other"),
  };

  // Deal labels
  const commDefaults = getCommissionDefaults();
  const dealLabels: Record<string, string> = {
    title: t("deals"),
    add: tD("add"),
    dealDate: tD("dealDate"),
    programType: tD("programType"),
    regular: tD("regular"),
    camp: tD("camp"),
    plan: tD("plan"),
    campus: tD("campus"),
    lodging: tD("lodging"),
    homestay: tD("homestay"),
    dormitory: tD("dormitory"),
    weeks: tD("weeks"),
    departDate: tD("departDate"),
    returnDate: tD("returnDate"),
    quoteUsd: tD("quoteUsd"),
    fxRate: tD("fxRate"),
    amountTwd: tD("amountTwd"),
    regFeeUsd: tD("regFeeUsd"),
    commissionRate: tD("commissionRate"),
    netUsd: tD("netUsd"),
    netTwd: tD("netTwd"),
    paidCurrency: tD("paidCurrency"),
    paidAmount: tD("paidAmount"),
    keyPoints: tD("keyPoints"),
    note: tD("note"),
    noDeals: tD("noDeals"),
    save: tc("save"),
    cancel: tc("cancel"),
    errGeneric: tErr("generic"),
    pt_regular: tD("regular"),
    pt_camp: tD("camp"),
  };

  const planOptions = PLANS.map((p) => ({ value: p, label: tPlan(p) }));
  const campusOptions = CAMPUSES.map((c) => ({ value: c, label: tCampus(c) }));

  const tabs = [
    {
      id: "contacts",
      label: `${t("contacts")} (${contactLogs.length})`,
      content: (
        <ContactLogTab
          leadId={id}
          logs={contactLogs.map((l) => ({
            id: l.id,
            channel: l.channel,
            result: l.result,
            note: l.note,
            logged_at: l.logged_at,
            user_name: l.user_name ?? "—",
          }))}
          channels={CONTACT_CHANNELS.map((c) => ({ value: c, label: tCh(c) }))}
          results={CONTACT_RESULTS.map((r) => ({ value: r, label: tCr(r) }))}
          labels={contactLabels}
        />
      ),
    },
    {
      id: "stages",
      label: `${t("stages")} (${stageEvents.length})`,
      content: (
        <StageTab
          leadId={id}
          stages={stageEvents.map((s) => ({
            id: s.id,
            stage: s.stage,
            event_date: s.event_date,
            note: s.note,
            created_at: s.event_date,
            user_name: s.user_name ?? "—",
          }))}
          stageTypes={STAGE_TYPES.map((s) => ({ value: s, label: tSt(s) }))}
          labels={stageLabels}
        />
      ),
    },
    {
      id: "invites",
      label: `${t("invites")} (${consultInvites.length})`,
      content: (
        <ConsultInviteTab
          leadId={id}
          invites={consultInvites.map((inv) => ({
            id: inv.id,
            scheduled_at: inv.scheduled_at,
            attendance: inv.attendance,
            absent_reason: inv.absent_reason,
            created_at: inv.invited_at,
            inviter_name: inv.inviter_name ?? "—",
          }))}
          labels={inviteLabels}
        />
      ),
    },
    {
      id: "deals",
      label: `${t("deals")} (${deals.length})`,
      content: (
        <DealTab
          leadId={id}
          deals={deals}
          plans={planOptions}
          campuses={campusOptions}
          canEditFinancials={can(user.role, "deals.edit_financials")}
          defaults={commDefaults}
          labels={dealLabels}
        />
      ),
    },
  ];

  return (
    <Shell
      title={lead.name}
      subtitle={`#${lead.id} · ${lead.entry_date}`}
    >
      {/* Back link */}
      <Link href="/leads" className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors">
        <Icon name="chevronRight" className="size-4 rotate-180" />
        {tc("back")}
      </Link>

      {/* Lead info card */}
      <div className="glass mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            {/* Status + changer */}
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={lead.status} label={ts(lead.status)} />
              {lead.season && (
                <span
                  className={`chip ${
                    lead.season === "peak"
                      ? "bg-warn/15 text-warn"
                      : "bg-white/[0.06] text-muted"
                  }`}
                >
                  {lead.season === "peak" ? t("season.peak") : t("season.off")}
                </span>
              )}
              {lead.latest_stage && (
                <span className="chip bg-accent/10 text-blue-300">
                  {tSt(lead.latest_stage as typeof STAGE_TYPES[number])}
                </span>
              )}
              {can(user.role, "leads.edit") && (
                <>
                  <StatusChanger
                    leadId={id}
                    current={lead.status}
                    statuses={statusOptions}
                    label={t("status")}
                  />
                  <StageChanger
                    leadId={id}
                    current={lead.latest_stage}
                    stages={stageOptions}
                    label={tSt("label")}
                  />
                </>
              )}
            </div>

            {/* Contact info */}
            <div className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {lead.phone && (
                <div>
                  <span className="text-xs text-muted">{t("phone")}</span>
                  <p>{lead.phone}</p>
                </div>
              )}
              {lead.email && (
                <div>
                  <span className="text-xs text-muted">{t("email")}</span>
                  <p>{lead.email}</p>
                </div>
              )}
              {lead.line_id && (
                <div>
                  <span className="text-xs text-muted">{t("lineId")}</span>
                  <p>{lead.line_id}</p>
                </div>
              )}
              {lead.source_name && (
                <div>
                  <span className="text-xs text-muted">{t("source")}</span>
                  <p>{lead.source_name}{lead.sub_source ? ` / ${lead.sub_source}` : ""}</p>
                </div>
              )}
              {lead.assistant_name && (
                <div>
                  <span className="text-xs text-muted">{t("assistant")}</span>
                  <p>{lead.assistant_name}</p>
                </div>
              )}
              {lead.sales_name && (
                <div>
                  <span className="text-xs text-muted">{t("sales")}</span>
                  <p>{lead.sales_name}</p>
                </div>
              )}
              {lead.age_group && (
                <div>
                  <span className="text-xs text-muted">{t("ageGroup")}</span>
                  <p>{tAg(lead.age_group as typeof AGE_GROUPS[number])}</p>
                </div>
              )}
              {lead.need && (
                <div>
                  <span className="text-xs text-muted">{t("need")}</span>
                  <p>{tNeed(lead.need as typeof LEARNING_NEEDS[number])}</p>
                </div>
              )}
              {lead.expected_depart && (
                <div>
                  <span className="text-xs text-muted">{t("expectedDepart")}</span>
                  <p>{lead.expected_depart}</p>
                </div>
              )}
              {lead.next_contact && (
                <div>
                  <span className="text-xs text-muted">{t("nextContact")}</span>
                  <p>{lead.next_contact}</p>
                </div>
              )}
            </div>

            {lead.lead_note && (
              <div>
                <span className="text-xs text-muted">{t("leadNote")}</span>
                <p className="whitespace-pre-line text-sm">{lead.lead_note}</p>
              </div>
            )}

            {lead.note && (
              <div>
                <span className="text-xs text-muted">{t("note")}</span>
                <p className="whitespace-pre-line text-sm">{lead.note}</p>
              </div>
            )}
          </div>

          {/* Edit / delete */}
          <div className="flex flex-shrink-0 items-center gap-2">
          {can(user.role, "leads.edit") && (
            <EditLeadModal
              lead={{
                id: lead.id,
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                line_id: lead.line_id,
                source_id: lead.source_id,
                sub_source: lead.sub_source,
                assistant_id: lead.assistant_id,
                sales_id: lead.sales_id,
                entry_date: lead.entry_date,
                age_group: lead.age_group,
                need: lead.need,
                student_type: lead.student_type,
                expected_depart: lead.expected_depart,
                expected_weeks: lead.expected_weeks,
                next_contact: lead.next_contact,
                note: lead.note,
                lead_note: lead.lead_note,
                season: lead.season,
              }}
              sources={sources}
              assistants={assistants}
              salesUsers={salesUsers}
              ageGroups={ageGroupOptions}
              needs={needOptions}
              studentTypes={studentTypeOptions}
              labels={editLabels}
            />
          )}
          {can(user.role, "leads.delete") && (
            <DeleteLeadButton
              leadId={lead.id}
              leadName={lead.name}
              labels={deleteLabels}
            />
          )}
          </div>
        </div>
      </div>

      {/* Tabs: contacts, stages, invites, deals */}
      <DetailTabs tabs={tabs} />
    </Shell>
  );
}
