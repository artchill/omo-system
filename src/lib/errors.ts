/**
 * Error codes returned by server actions. The UI turns a code into text with
 * messages/*.json ("Errors"), so errors are translated and never leak internals.
 */
export const ERROR_CODES = [
  "invalid",
  "locked",
  "email",
  "name",
  "passwordShort",
  "emailTaken",
  "lastAdmin",
  "self",
  "notFound",
  "generic",
  "sourceNameTaken",
  "leadNotFound",
  "permissionDenied",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export function isErrorCode(value: unknown): value is ErrorCode {
  return (
    typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value)
  );
}

export type FormState = { error?: ErrorCode };
