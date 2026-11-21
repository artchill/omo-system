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

  return (
    <Shell title={t("title")} subtitle={t("subtitle", { count: sources.length })}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <SourceModal labels={labels} grades={grades} />
      </div>

      <div className="glass overflow-hidden">
        {/* Header */}
        <div className="hidden border-b border-edge px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted sm:grid sm:grid-cols-[1fr_5rem_5rem_5rem_5rem]">
          <span>{t("name")}</span>
          <span>{t("grade")}</span>
          <span>{t("sort")}</span>
          <span>{t("active")}</span>
          <span>{tc("actions")}</span>
        </div>

        {sources.map((source) => (
          <div
            key={source.id}
            className="flex flex-wrap items-center gap-3 border-b border-edge px-5 py-3 transition-colors hover:bg-white/[0.03] sm:grid sm:grid-cols-[1fr_5rem_5rem_5rem_5rem]"
          >
            <span className="font-medium">
              {source.name}
            </span>
            <span className="text-sm text-muted">
              {source.grade || "—"}
            </span>
            <span className="text-sm text-muted">{source.sort}</span>
            <span>
              {source.active ? (
                <span className="inline-block size-2 rounded-full bg-good" />
              ) : (
                <span className="text-xs text-muted">✗</span>
              )}
            </span>
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
          </div>
        ))}

        {sources.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted">
            {tc("noData")}
          </p>
        )}
      </div>
    </Shell>
  );
}
