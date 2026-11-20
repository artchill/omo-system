"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { updateUserLocale } from "@/db/users";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth";

/**
 * Remember the visitor's language and re-render the page in it.
 * The value comes from the browser, so it is checked against the allow-list.
 * Signed-in users also get it saved to their profile.
 */
export async function setLocale(value: string): Promise<{ ok: boolean }> {
  if (!isLocale(value)) return { ok: false };

  (await cookies()).set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true, // only the server reads it
    secure: process.env.NODE_ENV === "production",
  });

  const user = await getCurrentUser();
  if (user) updateUserLocale(user.id, value);

  revalidatePath("/", "layout");
  return { ok: true };
}
