const PATHS = {
  dashboard: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  leads:
    "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 20c0-3.3 3.6-5 8-5s8 1.7 8 5",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01",
  users:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3 3-4.5 6.5-4.5s6.5 1.5 6.5 4.5M17 4.5a3.5 3.5 0 0 1 0 6.5M18 15.8c2 .5 3.5 1.7 3.5 4.2",
  logout: "M10 4H5v16h5M15 8l4 4-4 4M19 12H9",
} as const;

export type IconName = keyof typeof PATHS;

/** Small line icons. Decorative: the text label next to them carries the meaning. */
export function Icon({ name, className = "size-[1.15rem]" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
