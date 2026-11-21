/** Staff roles. Stored as these codes; labels live in messages/*.json ("Roles"). */
export const ROLES = ["admin", "sales", "assistant"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Who may do what. One place to read and change rules; every protected page
 * and server action calls `can()` / `requireRole()` instead of comparing roles inline.
 * More permissions are added as features arrive (leads, dashboards, ...).
 */
export const PERMISSIONS = {
  "users.manage": ["admin"],
  "leads.view": ["admin", "sales", "assistant"],
  "leads.create": ["admin", "sales"],
  "leads.edit": ["admin", "sales", "assistant"],
  "leads.import": ["admin", "sales"],
  "deals.create": ["admin", "sales", "assistant"],
  "deals.edit_financials": ["admin", "sales"],
  "dashboard.view": ["admin", "sales"],
  "dashboard.assistants": ["admin", "sales"],
  "settings.manage": ["admin"],
  "audit.view": ["admin"],
  "sources.manage": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
