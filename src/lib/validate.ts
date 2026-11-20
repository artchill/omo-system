import type { ErrorCode } from "./errors";

export const MIN_PASSWORD_LENGTH = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function cleanEmail(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").trim().toLowerCase();
}

export function cleanText(raw: FormDataEntryValue | null, max = 100): string {
  return String(raw ?? "").trim().slice(0, max);
}

/** Returns an error code, or null when the input is fine. */
export function checkNewUser(input: {
  email: string;
  name: string;
  password: string;
}): ErrorCode | null {
  if (!EMAIL_RE.test(input.email) || input.email.length > 254) return "email";
  if (!input.name) return "name";
  if (input.password.length < MIN_PASSWORD_LENGTH) return "passwordShort";
  if (input.password.length > 200) return "passwordShort";
  return null;
}
