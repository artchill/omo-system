"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";

/**
 * Remember the visitor's language and re-render the page in it.
 * The value comes from the browser, so it is checked against the allow-list.
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

  // TODO(auth step): also save the choice to the signed-in user's profile.
  revalidatePath("/", "layout");
  return { ok: true };
}
