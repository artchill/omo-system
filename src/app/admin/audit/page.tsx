import { getLocale, getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/auth";
import { listAuditLogs } from "@/db/audit-log";
import { Shell } from "@/components/Header";
import { formatDateTime } from "@/lib/format";
import Link from "next/link";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PAGE_SIZE = 50;

/** The changed fields of one entry, shown the same way on desktop and phone. */
function ChangeList({ entries }: { entries: [string, unknown][] }) {
  if (entries.length === 0) return <>—</>;
  return (
    <div className="flex flex-wrap gap-1">
      {entries.slice(0, 5).map(([field, val]) => {
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
      {entries.length > 5 && (
        <span className="opacity-50">+{entries.length - 5}</span>
      )}
    </div>
  );
}

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
        {/*
          A real table so the header and the rows share one column model.
          As two separate grids the last column sized to each grid's own
          content — the word "Time" against a full timestamp — so the
          headings did not sit above the values they describe.
        */}
        <table className="hidden w-full text-sm md:table">
          <thead>
            <tr className="border-b border-edge text-left text-xs font-medium uppercase tracking-wider text-muted">
              <th className="w-32 px-5 py-3">{t("user")}</th>
              <th className="w-28 px-4 py-3">{t("entity")}</th>
              <th className="w-28 px-4 py-3">{t("action")}</th>
              <th className="px-4 py-3">{t("changes")}</th>
              <th className="w-28 px-4 py-3">{t("lead")}</th>
              <th className="w-56 whitespace-nowrap px-5 py-3">{t("time")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">

        {rows.map((log) => {
          const changes = parseChanges(log.changes);
          const changeEntries = Object.entries(changes);

          return (
            <tr key={log.id} className="align-top transition-colors hover:bg-white/[0.03]">
              <td className="px-5 py-3 text-sm font-medium">
                {log.user_name ?? "—"}
              </td>
              <td className="px-4 py-3">
                <span className="chip w-fit whitespace-nowrap text-xs">{log.entity}</span>
              </td>
              <td className="px-4 py-3 text-sm text-muted">{log.action}</td>
              <td className="px-4 py-3 text-xs text-muted">
                <ChangeList entries={changeEntries} />
              </td>
              <td className="px-4 py-3 text-sm">
                {log.lead_name ? (
                  <Link href={`/leads/${log.lead_id}`} className="text-accent hover:underline">
                    {log.lead_name}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-xs tabular-nums text-muted">
                {formatDateTime(log.at, locale)}
              </td>
            </tr>
          );
        })}
          </tbody>
        </table>

        {/* ── Cards (below md) ── */}
        <div className="divide-y divide-edge md:hidden">
          {rows.map((log) => {
            const entries = Object.entries(parseChanges(log.changes));
            return (
              <div key={log.id} className="space-y-2 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip whitespace-nowrap text-xs">{log.entity}</span>
                  <span className="text-sm text-muted">{log.action}</span>
                  <span className="ml-auto whitespace-nowrap text-xs tabular-nums text-muted">
                    {formatDateTime(log.at, locale)}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  <ChangeList entries={entries} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 text-sm">
                  <span className="font-medium">{log.user_name ?? "—"}</span>
                  {log.lead_name && (
                    <Link
                      href={`/leads/${log.lead_id}`}
                      className="text-accent hover:underline"
                    >
                      {log.lead_name}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

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
