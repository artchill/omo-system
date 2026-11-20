"use server";

import { redirect } from "next/navigation";
import { insertFirstAdmin } from "@/db/users";
import { findUserByEmail } from "@/db/users";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession, purgeExpired } from "@/lib/session";
import { clearFailures, recordFailure, tooManyFailures } from "@/lib/throttle";
import { checkNewUser, cleanEmail, cleanText } from "@/lib/validate";
import type { FormState } from "@/lib/errors";

// Used so a wrong email takes about as long as a wrong password.
let dummyHash: Promise<string> | undefined;

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = cleanEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!email || !password || password.length > 200) return { error: "invalid" };

  if (tooManyFailures(email)) return { error: "locked" };

  const user = findUserByEmail(email);
  dummyHash ??= hashPassword("not-a-real-password");
  const ok = await verifyPassword(password, user?.password_hash ?? (await dummyHash));

  if (!user || !user.active || !ok) {
    recordFailure(email);
    return { error: "invalid" };
  }

  clearFailures(email);
  purgeExpired();
  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

/** First-run only: works while there are no users at all. */
export async function setupAdmin(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const input = {
    email: cleanEmail(formData.get("email")),
    name: cleanText(formData.get("name")),
    password: String(formData.get("password") ?? ""),
  };
  const problem = checkNewUser(input);
  if (problem) return { error: problem };

  const id = insertFirstAdmin({
    email: input.email,
    name: input.name,
    passwordHash: await hashPassword(input.password),
  });
  if (id === null) redirect("/login"); // someone already set up the system

  await createSession(id);
  redirect("/");
}
