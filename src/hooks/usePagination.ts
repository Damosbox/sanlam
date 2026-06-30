import { useEffect, useMemo, useState } from "react";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

interface UsePaginationOptions {
  defaultPageSize?: PageSize;
  storageKey?: string;
}

function readStoredPageSize(storageKey?: string, fallback: PageSize = 25): PageSize {
  if (typeof window === "undefined" || !storageKey) return fallback;
  try {
    const raw = window.sessionStorage.getItem(`pgsize:${storageKey}`);
    const n = raw ? Number(raw) : NaN;
    return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? (n as PageSize) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Generic client-side pagination over an in-memory array.
 * - Resets to page 1 whenever the underlying total changes (e.g. after filtering).
 * - Optionally persists the user's chosen page size in sessionStorage.
 */
export function usePagination<T>(items: T[], options: UsePaginationOptions = {}) {
  const { defaultPageSize = 25, storageKey } = options;
  const [pageSize, setPageSizeState] = useState<PageSize>(() =>
    readStoredPageSize(storageKey, defaultPageSize),
  );
  const [page, setPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 when filters shrink the list past current page
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const setPageSize = (size: PageSize) => {
    setPageSizeState(size);
    setPage(1);
    if (storageKey && typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(`pgsize:${storageKey}`, String(size));
      } catch {
        /* noop */
      }
    }
  };

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageItems,
    totalPages,
    totalItems,
  };
}