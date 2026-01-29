import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/broker/dashboard/DashboardHeader";
import { RenewalRateCards } from "@/components/broker/dashboard/RenewalRateCards";
import { ContactIndicatorsCard } from "@/components/broker/dashboard/ContactIndicatorsCard";
import { LeadsPipeline } from "@/components/broker/dashboard/LeadsPipeline";
import { AIRecommendations } from "@/components/broker/dashboard/AIRecommendations";
import { QuickActions } from "@/components/broker/dashboard/QuickActions";
import { NewsBanner } from "@/components/broker/dashboard/NewsBanner";
import { KPICard } from "@/components/broker/dashboard/KPICard";
import type { ProductType } from "@/components/broker/dashboard/ProductSelector";
import { CheckSquare, Wallet, TrendingUp, FileText } from "lucide-react";
import { formatFCFA } from "@/utils/formatCurrency";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardPage = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("all");
  const [kpiStats, setKpiStats] = useState({
    tasksCount: 0,
    commissions: 0,
    totalGWP: 0,
    totalPolicies: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchKPIStats();
  }, [selectedProduct]);

  const fetchKPIStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch subscriptions for KPIs
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("monthly_premium, products(category)")
        .eq("assigned_broker_id", user.id);

      // Fetch leads for tasks count
      const { data: leads } = await supabase
        .from("leads")
        .select("id, status")
        .eq("assigned_broker_id", user.id)
        .in("status", ["nouveau", "en_cours", "relance"]);

      // Filter by product type if not "all"
      let filteredSubs = subscriptions || [];
      if (selectedProduct !== "all") {
        const categoryMap: Record<string, string[]> = {
          auto: ["auto", "automobile"],
          mrh: ["mrh", "habitation", "multirisque"],
          sante: ["sante", "santé", "health"],
          vie: ["vie", "epargne", "épargne", "savings"],
          obseques: ["obseques", "obsèques", "funeral"],
        };
        const categories = categoryMap[selectedProduct] || [];
        filteredSubs = (subscriptions || []).filter(sub => {
          const productCategory = ((sub.products as any)?.category || "").toLowerCase();
          return categories.some(cat => productCategory.includes(cat));
        });
      }

      const totalGWP = filteredSubs.reduce((sum, sub) => sum + (sub.monthly_premium || 0) * 12, 0);
      const totalPolicies = filteredSubs.length;
      const commissions = Math.round(totalGWP * 0.15 / 12);
      const tasksCount = leads?.length || 0;

      setKpiStats({ tasksCount, commissions, totalGWP, totalPolicies });
    } catch (error) {
      console.error("Error fetching KPI stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl animate-fade-in px-1 sm:px-0">
      {/* ROW 0: Header + Quick Actions */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
        <DashboardHeader 
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
        />
        <QuickActions />
      </div>

      {/* ROW 1: KPI Cards - 4 columns */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 sm:h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <KPICard
            icon={CheckSquare}
            label="Mes Tâches"
            value={kpiStats.tasksCount}
            link="/b2b/leads"
            highlight
            trend="Leads actifs"
          />
          <KPICard
            icon={Wallet}
            label="Mes commissions"
            value={formatFCFA(kpiStats.commissions)}
            trend="Mois en cours"
          />
          <KPICard
            icon={TrendingUp}
            label="Mes Primes"
            value={formatFCFA(kpiStats.totalGWP)}
            trend="Prime annuelle brute"
          />
          <KPICard
            icon={FileText}
            label="Mes polices"
            value={`${kpiStats.totalPolicies} Contrats`}
            link="/b2b/policies"
            trend="Contrats actifs"
          />
        </div>
      )}

      {/* ROW 2: Main Content - 7/5 split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          <RenewalRateCards selectedProduct={selectedProduct} />
          <ContactIndicatorsCard selectedProduct={selectedProduct} />
        </div>

        {/* Right Column: 5 cols */}
        <div className="lg:col-span-5 space-y-4">
          <LeadsPipeline />
          <AIRecommendations />
        </div>
      </div>

      {/* ROW 3: News Banner - Full Width */}
      <NewsBanner />
    </div>
  );
};

export default DashboardPage;
