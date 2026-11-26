import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/auth";
import { listSources } from "@/db/sources";
import { SOURCE_GRADES } from "@/domain/enums";
import { Shell } from "@/components/Header";
import { SourceModal } from "./SourceModal";

/**
 * Shared column track for the header and the rows, so the two always line up.
 * The name gets the larger share of spare width but not all of it — a plain
 * `1fr` there pushed the other four columns hard against the right edge, far
 * from the data they label.
 */
const COLUMNS =
  "sm:grid-cols-[minmax(8rem,3fr)_minmax(4rem,1fr)_minmax(5rem,1fr)_minmax(4rem,1fr)_auto]";

export default async function SourcesPage() {
  const user = await requirePermission("sources.manage");
  const [t, tc] = await Promise.all([
    getTranslations("Sources"),
    getTranslations("Common"),
  ]);
  void user;

  const sources = listSources(true);
  const grades = SOURCE_GRADES.filter((g) => g !== "");

  const labels = {
    add: t("add"),
    edit: t("edit"),
    name: t("name"),
    grade: t("grade"),
    active: t("active"),
    sort: t("sort"),
    save: tc("save"),
    cancel: tc("cancel"),
  };

  const editModal = (source: (typeof sources)[number]) => (
    <SourceModal
      source={{
        id: source.id,
        name: source.name,
        grade: source.grade,
        active: source.active,
        sort: source.sort,
      }}
      labels={labels}
      grades={grades}
    />
  );

  const activeDot = (active: number) =>
    active ? (
      <span
        className="inline-block size-2 rounded-full bg-good"
        title={t("active")}
      />
    ) : (
      <span className="text-xs text-muted">✗</span>
    );

  return (
    <Shell title={t("title")} subtitle={t("subtitle", { count: sources.length })}>
      <div className="mb-6 flex justify-end">
        <SourceModal labels={labels} grades={grades} />
      </div>

      {/* ── Table (sm and up) ─────────────────────────────── */}
      <div className="glass hidden overflow-hidden sm:block">
        <div
          className={`grid ${COLUMNS} items-center gap-4 border-b border-edge px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted`}
        >
          <span>{t("name")}</span>
          <span className="whitespace-nowrap">{t("grade")}</span>
          <span className="whitespace-nowrap">{t("sort")}</span>
          <span className="whitespace-nowrap">{t("active")}</span>
          <span className="whitespace-nowrap text-right">{tc("actions")}</span>
        </div>

        {sources.map((source) => (
          <div
            key={source.id}
            className={`grid ${COLUMNS} items-center gap-4 border-b border-edge px-5 py-3 transition-colors last:border-b-0 hover:bg-white/[0.03]`}
          >
            <span className="min-w-0 truncate font-medium">{source.name}</span>
            <span className="text-sm text-muted">{source.grade || "—"}</span>
            <span className="text-sm tabular-nums text-muted">{source.sort}</span>
            <span>{activeDot(source.active)}</span>
            <div className="justify-self-end">{editModal(source)}</div>
          </div>
        ))}

        {sources.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted">{tc("noData")}</p>
        )}
      </div>

      {/* ── Cards (below sm) ──────────────────────────────── */}
      <div className="space-y-3 sm:hidden">
        {sources.map((source) => (
          <div key={source.id} className="glass p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <span className="min-w-0 break-words font-medium">{source.name}</span>
              {editModal(source)}
            </div>
            <dl className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted">
              <div className="flex items-center gap-1.5">
                <dt className="text-xs uppercase tracking-wider">{t("grade")}</dt>
                <dd>{source.grade || "—"}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="text-xs uppercase tracking-wider">{t("sort")}</dt>
                <dd className="tabular-nums">{source.sort}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="text-xs uppercase tracking-wider">{t("active")}</dt>
                <dd className="flex items-center">{activeDot(source.active)}</dd>
              </div>
            </dl>
          </div>
        ))}

        {sources.length === 0 && (
          <div className="glass px-5 py-8 text-center text-sm text-muted">
            {tc("noData")}
          </div>
        )}
      </div>
    </Shell>
  );
}
