import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { can, type Permission } from "@/domain/roles";
import { readSession, type SessionUser } from "./session";

/** Current user for this request (looked up once per request). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  try {
    return await readSession();
  } catch {
    return null;
  }
});

/** Use at the top of every protected page and server action. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Like requireUser, but also checks a permission. Shows "not found" if denied. */
export async function requirePermission(
  permission: Permission,
): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) notFound();
  return user;
}
