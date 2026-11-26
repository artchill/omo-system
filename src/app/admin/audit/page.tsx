import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/auth";
import { listAuditLogs } from "@/db/audit-log";
import { Shell } from "@/components/Header";
import { formatDateTime } from "@/lib/format";
import Link from "next/link";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 50;

export default async function AuditLogPage(props: {
  searchParams: SearchParams;
}) {
  await requirePermission("audit.view");
  const sp = await props.searchParams;
  const [t, tc, locale] = await Promise.all([
    getTranslations("AuditLog"),
    getTranslations("Common"),
    getLocale(),
  ]);

  const entity = typeof sp.entity === "string" ? sp.entity : undefined;
  const page = Math.max(1, parseInt(String(sp.page ?? "1"), 10));
  const offset = (page - 1) * PAGE_SIZE;

  const { rows, total } = listAuditLogs({
    entity,
    limit: PAGE_SIZE,
    offset,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function parseChanges(raw: string): Record<string, unknown> {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  const entities = ["lead", "user", "source", "settings", "deal", "contact_log", "stage_event", "consult_invite"];

  return (
    <Shell title={t("title")}>
      <div className="mb-6">
        {/*
          Nine filters: without wrapping this row forced the whole document
          wider than the viewport on tablets and phones.
        */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/audit"
            className={`chip text-xs ${!entity ? "bg-accent/20 text-accent" : ""}`}
          >
            {tc("all")}
          </Link>
          {entities.map((e) => (
            <Link
              key={e}
              href={`/admin/audit?entity=${e}`}
              className={`chip text-xs ${entity === e ? "bg-accent/20 text-accent" : ""}`}
            >
              {e}
            </Link>
          ))}
        </div>
      </div>

      <div className="glass overflow-hidden">
        {/* Header */}
        <div className="hidden border-b border-edge px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted md:grid md:grid-cols-[8rem_6rem_6rem_minmax(0,1fr)_6rem_auto] md:gap-x-4">
          <span>{t("user")}</span>
          <span>{t("entity")}</span>
          <span>{t("action")}</span>
          <span>{t("changes")}</span>
          <span>{t("lead")}</span>
          <span>{t("time")}</span>
        </div>

        {rows.map((log) => {
          const changes = parseChanges(log.changes);
          const changeEntries = Object.entries(changes);

          return (
            <div
              key={log.id}
              className="flex flex-col gap-1 border-b border-edge px-5 py-3 transition-colors hover:bg-white/[0.03] md:grid md:grid-cols-[8rem_6rem_6rem_minmax(0,1fr)_6rem_auto] md:gap-x-4 md:items-start"
            >
              <span className="text-sm font-medium">
                {log.user_name ?? "—"}
              </span>
              <span className="chip w-fit text-xs">{log.entity}</span>
              <span className="text-sm text-muted">{log.action}</span>
              <div className="text-xs text-muted">
                {changeEntries.length === 0 ? (
                  "—"
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {changeEntries.slice(0, 5).map(([field, val]) => {
                      const arr = Array.isArray(val) ? val : [null, val];
                      return (
                        <span key={field} className="inline-block rounded bg-white/5 px-1.5 py-0.5">
                          <span className="font-medium">{field}:</span>{" "}
                          {arr[0] ? (
                            <>
                              <span className="line-through opacity-50">{String(arr[0])}</span>
                              {" → "}
                            </>
                          ) : null}
                          {String(arr[1] ?? "")}
                        </span>
                      );
                    })}
                    {changeEntries.length > 5 && (
                      <span className="opacity-50">+{changeEntries.length - 5}</span>
                    )}
                  </div>
                )}
              </div>
              <span className="text-sm">
                {log.lead_name ? (
                  <Link href={`/leads/${log.lead_id}`} className="text-accent hover:underline">
                    {log.lead_name}
                  </Link>
                ) : (
                  "—"
                )}
              </span>
              <span className="whitespace-nowrap text-xs tabular-nums text-muted">
                {formatDateTime(log.at, locale)}
              </span>
            </div>
          );
        })}

        {rows.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted">
            {t("noLogs")}
          </p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          {page > 1 && (
            <Link
              href={`/admin/audit?${entity ? `entity=${entity}&` : ""}page=${page - 1}`}
              className="btn btn-ghost text-xs"
            >
              {tc("prev")}
            </Link>
          )}
          <span className="text-muted">{tc("page", { page, total: totalPages })}</span>
          {page < totalPages && (
            <Link
              href={`/admin/audit?${entity ? `entity=${entity}&` : ""}page=${page + 1}`}
              className="btn btn-ghost text-xs"
            >
              {tc("next")}
            </Link>
          )}
        </div>
      )}
    </Shell>
  );
}
