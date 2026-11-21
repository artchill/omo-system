"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { setSetting } from "@/db/settings";
import { insertAuditLog } from "@/db/audit-log";

const ALLOWED_KEYS = [
  "peak_months",
  "countdown_new",
  "countdown_grace",
  "countdown_active",
  "countdown_consult",
  "default_reg_fee",
  "default_rate_normal",
  "default_rate_camp",
  "default_rate_day",
  "dashboard_visibility",
];

export async function saveSettingsAction(fd: FormData) {
  const user = await requirePermission("settings.manage");

  const changes: Record<string, [string, string]> = {};

  for (const key of ALLOWED_KEYS) {
    const val = fd.get(key);
    if (val !== null) {
      const value = String(val).trim();
      setSetting(key, value);
      changes[key] = ["", value]; // We don't track old values here for simplicity
    }
  }

  insertAuditLog({
    user_id: user.id,
    entity: "settings",
    action: "update",
    changes,
  });

  revalidatePath("/admin/settings");
  return { ok: true };
}
