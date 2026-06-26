import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToolbarOption {
  label: string;
  value: string;
}

export interface ToolbarFilter {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ToolbarOption[];
  width?: string;
}

export interface ToolbarSort {
  value: string;
  onChange: (value: string) => void;
  options: ToolbarOption[];
  width?: string;
}

interface DataTableToolbarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    width?: string;
  };
  filters?: ToolbarFilter[];
  sort?: ToolbarSort;
  onExport?: () => void;
  exportLabel?: string;
  extraActions?: ReactNode;
  className?: string;
}

/**
 * Barre d'outils unifiée pour les tableaux :
 * [🔍 Recherche]  [Filtre 1 ▾] [Filtre 2 ▾] [Tri ▾]   [Actions]  [⬇ Export]
 */
export function DataTableToolbar({
  search,
  filters = [],
  sort,
  onExport,
  exportLabel = "Exporter CSV",
  extraActions,
  className,
}: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-center gap-2",
        className,
      )}
    >
      {search && (
        <div className={cn("relative", search.width ?? "w-full sm:w-[260px]")}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? "Rechercher..."}
            className="pl-9"
          />
        </div>
      )}

      {filters.map((f) => (
        <Select key={f.id} value={f.value} onValueChange={f.onChange}>
          <SelectTrigger className={f.width ?? "w-[180px]"}>
            <SelectValue placeholder={f.label} />
          </SelectTrigger>
          <SelectContent>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {sort && (
        <Select value={sort.value} onValueChange={sort.onChange}>
          <SelectTrigger className={sort.width ?? "w-[220px]"}>
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            {sort.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {extraActions}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            {exportLabel}
          </Button>
        )}
      </div>
    </div>
  );
}