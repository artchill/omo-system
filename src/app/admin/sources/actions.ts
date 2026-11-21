"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { insertAuditLog } from "@/db/audit-log";
import {
  insertSource,
  updateSource,
  sourceNameExists,
  findSourceById,
} from "@/db/sources";
import { cleanText } from "@/lib/validate";

export async function createSourceAction(fd: FormData) {
  const user = await requirePermission("sources.manage");
  const name = cleanText(fd.get("name"), 50);
  const grade = cleanText(fd.get("grade"), 10);
  const sort = parseInt(String(fd.get("sort") ?? "0"), 10) || 0;

  if (!name) return { error: "name" as const };
  if (sourceNameExists(name)) return { error: "sourceNameTaken" as const };

  const id = insertSource(name, grade, sort);
  insertAuditLog({
    user_id: user.id,
    entity: "source",
    action: "create",
    changes: { id, name, grade, sort },
  });
  revalidatePath("/admin/sources");
  return {};
}

export async function updateSourceAction(fd: FormData) {
  const user = await requirePermission("sources.manage");
  const id = parseInt(String(fd.get("id") ?? "0"), 10);
  const name = cleanText(fd.get("name"), 50);
  const grade = cleanText(fd.get("grade"), 10);
  const active = fd.get("active") === "on" || fd.get("active") === "true";
  const sort = parseInt(String(fd.get("sort") ?? "0"), 10) || 0;

  if (!name) return { error: "name" as const };
  const existing = findSourceById(id);
  if (!existing) return { error: "notFound" as const };
  if (sourceNameExists(name, id)) return { error: "sourceNameTaken" as const };

  const oldValues = { name: existing.name, grade: existing.grade, active: existing.active, sort: existing.sort };
  updateSource(id, name, grade, active, sort);
  insertAuditLog({
    user_id: user.id,
    entity: "source",
    action: "update",
    changes: { id, old: oldValues, new: { name, grade, active, sort } },
  });
  revalidatePath("/admin/sources");
  return {};
}
