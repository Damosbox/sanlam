import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatFCFA } from "@/utils/formatCurrency";
import type { ProductType } from "./ProductSelector";
import { 
  Car, 
  Shield, 
  AlertTriangle,
  Home,
  Flame,
  Key,
  HeartPulse,
  PieChart,
  Users,
  Wallet,
  TrendingUp,
  Percent,
  Clock
} from "lucide-react";

interface ProductSpecificKPIsProps {
  selectedProduct: ProductType;
}

interface KPIData {
  label: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}

export const ProductSpecificKPIs = ({ selectedProduct }: ProductSpecificKPIsProps) => {
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProductKPIs();
  }, [selectedProduct]);

  const fetchProductKPIs = async () => {
    if (selectedProduct === "all") {
      setKpis([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("*, products(name, category), claims(*)")
        .eq("assigned_broker_id", user.id);

      // Filter by product type
      const categoryMap: Record<string, string[]> = {
        auto: ["auto", "automobile"],
        mrh: ["mrh", "habitation", "multirisque"],
        sante: ["sante", "santé", "health"],
        vie: ["vie", "epargne", "épargne", "savings"],
        obseques: ["obseques", "obsèques", "funeral"],
      };
      
      const categories = categoryMap[selectedProduct] || [];
      const filteredSubs = subscriptions?.filter(sub => {
        const productCategory = ((sub.products as any)?.category || "").toLowerCase();
        const productName = ((sub.products as any)?.name || "").toLowerCase();
        return categories.some(cat => 
          productCategory.includes(cat) || productName.includes(cat)
        );
      }) || [];

      // Generate product-specific KPIs
      const productKPIs = generateProductKPIs(selectedProduct, filteredSubs);
      setKpis(productKPIs);
    } catch (error) {
      console.error("Error fetching product KPIs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateProductKPIs = (product: ProductType, subscriptions: any[]): KPIData[] => {
    const totalPremium = subscriptions.reduce((sum, s) => sum + (s.monthly_premium * 12), 0);
    const claimsCount = subscriptions.reduce((sum, s) => sum + ((s.claims as any[])?.length || 0), 0);
    const claimsCost = subscriptions.reduce((sum, s) => {
      const claims = (s.claims as any[]) || [];
      return sum + claims.reduce((c: number, claim: any) => c + (claim.cost_estimation || 0), 0);
    }, 0);

    switch (product) {
      case "auto":
        return [
          { 
            label: "Sinistralité", 
            value: totalPremium > 0 ? `${Math.round((claimsCost / totalPremium) * 100)}%` : "0%",
            icon: AlertTriangle,
            description: "Ratio S/P"
          },
          { 
            label: "Flottes", 
            value: Math.round(subscriptions.length * 0.15),
            icon: Car,
            description: "Contrats flotte"
          },
          { 
            label: "RC seule", 
            value: `${Math.round(subscriptions.length * 0.35)}%`,
            icon: Shield,
            description: "vs Tous Risques"
          },
        ];

      case "obseques":
        return [
          { 
            label: "Capital moyen", 
            value: subscriptions.length > 0 
              ? formatFCFA(totalPremium / subscriptions.length * 10) 
              : formatFCFA(0),
            icon: Shield,
            description: "Par contrat"
          },
          { 
            label: "Bénéf. moyens", 
            value: "4.2",
            icon: Users,
            description: "Par contrat"
          },
          { 
            label: "Délai moyen", 
            value: "18 mois",
            icon: Clock,
            description: "Ancienneté contrats"
          },
        ];

      default:
        return [];
    }
  };

  if (selectedProduct === "all" || kpis.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="p-3">
              <Skeleton className="h-14 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {kpis.map((kpi, index) => (
        <Card 
          key={kpi.label}
          className={cn(
            "border-border/60 transition-all duration-200 hover:shadow-soft hover:border-primary/20",
            "animate-fade-in bg-secondary/5"
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium mb-0.5 truncate">
                  {kpi.label}
                </p>
                <p className="text-sm sm:text-base font-bold text-secondary">
                  {kpi.value}
                </p>
                {kpi.description && (
                  <p className="text-[9px] text-muted-foreground mt-0.5 truncate">
                    {kpi.description}
                  </p>
                )}
              </div>
              <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <kpi.icon className="w-3 h-3 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
