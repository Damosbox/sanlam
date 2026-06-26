import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PAGE_SIZE_OPTIONS, type PageSize } from "@/hooks/usePagination";

interface DataTablePaginationProps {
  page: number;
  pageSize: PageSize;
  totalItems: number;
  setPage: (n: number) => void;
  setPageSize: (n: PageSize) => void;
  className?: string;
  /** Singular label, e.g. "client" → « 26–50 sur 137 clients » */
  itemLabel?: string;
}

export function DataTablePagination({
  page,
  pageSize,
  totalItems,
  setPage,
  setPageSize,
  className,
  itemLabel = "élément",
}: DataTablePaginationProps) {
  if (totalItems <= 0) return null;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const plural = totalItems > 1 ? `${itemLabel}s` : itemLabel;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="text-muted-foreground tabular-nums">
        {from.toLocaleString("fr-FR")}–{to.toLocaleString("fr-FR")} sur{" "}
        {totalItems.toLocaleString("fr-FR")} {plural}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground hidden sm:inline">Lignes</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v) as PageSize)}>
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(1)}
            disabled={page <= 1}
            aria-label="Première page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 tabular-nums">
            Page {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            aria-label="Dernière page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}