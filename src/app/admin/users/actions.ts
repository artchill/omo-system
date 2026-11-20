"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isRole } from "@/domain/roles";
import {
  countActiveAdmins,
  findUserByEmail,
  findUserById,
  insertUser,
  updateUserPassword,
  updateUserRoleActive,
} from "@/db/users";
import { requirePermission } from "@/lib/auth";
import type { ErrorCode } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import { destroyAllSessionsFor } from "@/lib/session";
import { checkNewUser, cleanEmail, cleanText, MIN_PASSWORD_LENGTH } from "@/lib/validate";

const BACK = "/admin/users";
const fail = (code: ErrorCode): never => redirect(`${BACK}?e=${code}`);
const done = (code: "created" | "updated" | "passwordReset"): never => {
  revalidatePath(BACK);
  return redirect(`${BACK}?ok=${code}`);
};

export async function createUserAction(formData: FormData) {
  await requirePermission("users.manage");

  const role = formData.get("role");
  const input = {
    email: cleanEmail(formData.get("email")),
    name: cleanText(formData.get("name")),
    password: String(formData.get("password") ?? ""),
  };
  const problem = checkNewUser(input);
  if (problem) fail(problem);
  if (!isRole(role)) fail("generic");
  if (findUserByEmail(input.email)) fail("emailTaken");

  insertUser({
    email: input.email,
    name: input.name,
    passwordHash: await hashPassword(input.password),
    role: role as never,
  });
  done("created");
}

export async function updateUserAction(formData: FormData) {
  const me = await requirePermission("users.manage");

  const id = Number(formData.get("id"));
  const role = formData.get("role");
  const active = formData.get("active") === "on";
  const target = Number.isInteger(id) ? findUserById(id) : undefined;
  if (!target) fail("notFound");
  if (!isRole(role)) fail("generic");

  const t = target!;
  if (t.id === me.id && (role !== "admin" || !active)) fail("self");
  const losesAdmin = t.role === "admin" && t.active === 1 && (role !== "admin" || !active);
  if (losesAdmin && countActiveAdmins() <= 1) fail("lastAdmin");

  updateUserRoleActive(t.id, role as never, active);
  if (!active || role !== t.role) destroyAllSessionsFor(t.id); // re-login with new rights
  done("updated");
}

export async function resetPasswordAction(formData: FormData) {
  await requirePermission("users.manage");

  const id = Number(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  const target = Number.isInteger(id) ? findUserById(id) : undefined;
  if (!target) fail("notFound");
  if (password.length < MIN_PASSWORD_LENGTH || password.length > 200) fail("passwordShort");

  updateUserPassword(target!.id, await hashPassword(password));
  destroyAllSessionsFor(target!.id);
  done("passwordReset");
}
