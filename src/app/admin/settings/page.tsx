import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/lib/auth";
import { getAllSettings } from "@/db/settings";
import { Shell } from "@/components/Header";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  await requirePermission("settings.manage");
  const [t, tc] = await Promise.all([
    getTranslations("Settings"),
    getTranslations("Common"),
  ]);

  const settings = getAllSettings();

  const labels = {
    peakMonths: t("peakMonths"),
    countdownNew: t("countdownNew"),
    countdownGrace: t("countdownGrace"),
    countdownActive: t("countdownActive"),
    countdownConsult: t("countdownConsult"),
    defaultRegFee: t("defaultRegFee"),
    defaultRateNormal: t("defaultRateNormal"),
    defaultRateCamp: t("defaultRateCamp"),
    defaultRateDay: t("defaultRateDay"),
    dashboardVisibility: t("dashboardVisibility"),
    saved: t("saved"),
    save: tc("save"),
  };

  return (
    <Shell title={t("title")}>
      <h2 className="mb-6 text-lg font-semibold">{t("title")}</h2>
      <div className="glass p-6">
        <SettingsForm settings={settings} labels={labels} />
      </div>
    </Shell>
  );
}
