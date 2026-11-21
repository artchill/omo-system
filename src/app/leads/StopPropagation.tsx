"use client";

export function StopPropagation({ children }: { children: React.ReactNode }) {
  return (
    <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      {children}
    </span>
  );
}
