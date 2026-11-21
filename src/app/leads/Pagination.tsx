"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Props {
  total: number;
  pageSize: number;
  labels: { prev: string; next: string; page: string };
}

export function Pagination({ total, pageSize, labels }: Props) {
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `/leads?${params.toString()}`;
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-4">
      <span className="text-xs text-muted">
        {labels.page.replace("{page}", String(currentPage)).replace("{total}", String(totalPages))}
      </span>
      <div className="flex gap-2">
        {currentPage > 1 && (
          <Link href={buildHref(currentPage - 1)} className="btn btn-ghost text-xs">
            ← {labels.prev}
          </Link>
        )}
        {currentPage < totalPages && (
          <Link href={buildHref(currentPage + 1)} className="btn btn-ghost text-xs">
            {labels.next} →
          </Link>
        )}
      </div>
    </div>
  );
}
