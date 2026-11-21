import "server-only";
import { db } from "./index";

export function getSetting(key: string): string | undefined {
  const row = db()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string) {
  db()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = db()
    .prepare("SELECT key, value FROM settings")
    .all() as unknown as { key: string; value: string }[];
  const result: Record<string, string> = {};
  for (const row of rows) result[row.key] = row.value;
  return result;
}

/** Peak months as an array of month numbers (1-12). */
export function getPeakMonths(): number[] {
  const val = getSetting("peak_months") ?? "1,2,7,8";
  return val.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
}

/** Check if a date falls in peak season. */
export function isPeakSeason(dateStr: string): boolean {
  const month = new Date(dateStr).getMonth() + 1;
  return getPeakMonths().includes(month);
}

export function getCountdownDays(): {
  newLead: number;
  grace: number;
  active: number;
  consult: number;
} {
  return {
    newLead: parseInt(getSetting("countdown_new") ?? "3", 10),
    grace: parseInt(getSetting("countdown_grace") ?? "1", 10),
    active: parseInt(getSetting("countdown_active") ?? "10", 10),
    consult: parseInt(getSetting("countdown_consult") ?? "30", 10),
  };
}

export function getCommissionDefaults(): {
  regFee: number;
  rateNormal: number;
  rateCamp: number;
  rateDay: number;
} {
  return {
    regFee: parseFloat(getSetting("default_reg_fee") ?? "100"),
    rateNormal: parseFloat(getSetting("default_rate_normal") ?? "0.35"),
    rateCamp: parseFloat(getSetting("default_rate_camp") ?? "0.25"),
    rateDay: parseFloat(getSetting("default_rate_day") ?? "0.20"),
  };
}
