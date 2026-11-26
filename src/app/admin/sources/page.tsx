import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/auth";
import { listSources } from "@/db/sources";
import { SOURCE_GRADES } from "@/domain/enums";
import { Shell } from "@/components/Header";
import { SourceModal } from "./SourceModal";

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

      {/*
        ── Table (sm and up) ───────────────────────────────
        A real table, not two CSS grids stacked on top of each other. With
        separate grids the last column is sized by each grid's own content —
        the word "Actions" in the header, a button in the rows — so the two
        computed different tracks and only the first column ever lined up.
        A table gives header and body one shared column model.
      */}
      <div className="glass hidden overflow-hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs font-medium uppercase tracking-wider text-muted">
              <th className="px-5 py-3">{t("name")}</th>
              <th className="w-28 whitespace-nowrap px-4 py-3">{t("grade")}</th>
              <th className="w-32 whitespace-nowrap px-4 py-3">{t("sort")}</th>
              <th className="w-28 whitespace-nowrap px-4 py-3">{t("active")}</th>
              <th className="w-40 whitespace-nowrap px-5 py-3 text-right">
                {tc("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {sources.map((source) => (
              <tr key={source.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="max-w-0 truncate px-5 py-3 font-medium" title={source.name}>
                  {source.name}
                </td>
                <td className="px-4 py-3 text-muted">{source.grade || "—"}</td>
                <td className="px-4 py-3 tabular-nums text-muted">{source.sort}</td>
                <td className="px-4 py-3">{activeDot(source.active)}</td>
                <td className="px-5 py-3 text-right">{editModal(source)}</td>
              </tr>
            ))}
          </tbody>
        </table>

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
