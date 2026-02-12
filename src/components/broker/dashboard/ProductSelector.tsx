import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Car, 
  Users,
  LayoutGrid 
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductType = "all" | "auto" | "obseques";

interface ProductSelectorProps {
  value: ProductType;
  onChange: (value: ProductType) => void;
  className?: string;
  showCounts?: boolean;
  counts?: Record<ProductType, number>;
}

const PRODUCTS: { id: ProductType; label: string; shortLabel: string; icon: React.ElementType }[] = [
  { id: "all", label: "Tous", shortLabel: "Tous", icon: LayoutGrid },
  { id: "auto", label: "Auto", shortLabel: "Auto", icon: Car },
  { id: "obseques", label: "Obsèques", shortLabel: "Obsq", icon: Users },
];

const STORAGE_KEY = "product-hub-selected-product";

export const ProductSelector = ({ 
  value, 
  onChange, 
  className,
  showCounts = false,
  counts = {} as Record<ProductType, number>
}: ProductSelectorProps) => {
  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && PRODUCTS.some(p => p.id === stored)) {
      onChange(stored as ProductType);
    }
  }, []);

  // Save to localStorage on change
  const handleChange = (newValue: string) => {
    const productType = newValue as ProductType;
    localStorage.setItem(STORAGE_KEY, productType);
    onChange(productType);
  };

  return (
    <Tabs value={value} onValueChange={handleChange} className={className}>
      <TabsList className="h-9 p-1 bg-muted/50 border border-border/60">
        {PRODUCTS.map((product) => (
          <TabsTrigger
            key={product.id}
            value={product.id}
            className={cn(
              "h-7 px-2 sm:px-3 text-xs font-medium gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
              "transition-all duration-200"
            )}
          >
            <product.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{product.label}</span>
            <span className="sm:hidden">{product.shortLabel}</span>
            {showCounts && counts[product.id] !== undefined && counts[product.id] > 0 && (
              <span className={cn(
                "ml-1 text-[10px] px-1.5 py-0.5 rounded-full",
                value === product.id 
                  ? "bg-primary-foreground/20 text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                {counts[product.id]}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export { PRODUCTS };
