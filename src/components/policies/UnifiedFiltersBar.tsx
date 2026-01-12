import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductSelector, ProductType, PRODUCTS } from "@/components/broker/dashboard/ProductSelector";
import { Search, RotateCcw, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type StatusFilterType = "all" | "active" | "cancelled" | "expired";
export type LeadStatusFilterType = "all" | "nouveau" | "en_cours" | "relance" | "converti" | "perdu";

interface StatusOption {
  value: string;
  label: string;
}

interface UnifiedFiltersBarProps {
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Product filter
  selectedProduct: ProductType;
  onProductChange: (product: ProductType) => void;
  productCounts?: Partial<Record<ProductType, number>>;
  
  // Status filter (optional)
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  statusOptions?: StatusOption[];
  statusLabel?: string;
  
  // Results counter
  totalCount: number;
  filteredCount: number;
  
  // Config
  showProductFilter?: boolean;
  showStatusFilter?: boolean;
  className?: string;
}

export const UnifiedFiltersBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Rechercher par nom, email, n° police...",
  selectedProduct,
  onProductChange,
  productCounts = {},
  statusFilter = "all",
  onStatusFilterChange,
  statusOptions = [],
  statusLabel = "Statut",
  totalCount,
  filteredCount,
  showProductFilter = true,
  showStatusFilter = false,
  className,
}: UnifiedFiltersBarProps) => {
  const isMobile = useIsMobile();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters = useMemo(() => {
    return searchValue !== "" || selectedProduct !== "all" || statusFilter !== "all";
  }, [searchValue, selectedProduct, statusFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchValue !== "") count++;
    if (selectedProduct !== "all") count++;
    if (statusFilter !== "all") count++;
    return count;
  }, [searchValue, selectedProduct, statusFilter]);

  const handleReset = () => {
    onSearchChange("");
    onProductChange("all");
    if (onStatusFilterChange) {
      onStatusFilterChange("all");
    }
  };

  const FiltersContent = () => (
    <>
      {/* Product Selector */}
      {showProductFilter && (
        <div className="w-full lg:w-auto">
          {isMobile ? (
            <Select value={selectedProduct} onValueChange={(val) => onProductChange(val as ProductType)}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Produit" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCTS.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center gap-2">
                      <product.icon className="h-4 w-4" />
                      {product.label}
                      {productCounts[product.id] !== undefined && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                          {productCounts[product.id]}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <ProductSelector
              value={selectedProduct}
              onChange={onProductChange}
              showCounts={Object.keys(productCounts).length > 0}
              counts={productCounts as Record<ProductType, number>}
            />
          )}
        </div>
      )}

      {/* Status Filter */}
      {showStatusFilter && statusOptions.length > 0 && onStatusFilterChange && (
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[160px] h-9">
            <SelectValue placeholder={statusLabel} />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </>
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search + Mobile Filters Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-9"
          />
        </div>
        
        {isMobile && (showProductFilter || showStatusFilter) && (
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1 px-3">
                <Filter className="h-4 w-4" />
                <span>Filtres</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-primary text-primary-foreground">
                    {activeFiltersCount}
                  </Badge>
                )}
                {filtersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        )}
      </div>

      {/* Desktop Filters */}
      {!isMobile && (showProductFilter || showStatusFilter) && (
        <div className="flex flex-wrap items-center gap-3">
          <FiltersContent />
        </div>
      )}

      {/* Mobile Filters (Collapsible) */}
      {isMobile && (
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleContent className="space-y-3">
            <FiltersContent />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Results Counter + Reset */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {filteredCount === totalCount ? (
            <span>{totalCount} résultat{totalCount > 1 ? "s" : ""}</span>
          ) : (
            <span>
              <span className="font-medium text-foreground">{filteredCount}</span> sur {totalCount} résultat{totalCount > 1 ? "s" : ""}
            </span>
          )}
        </span>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
};
