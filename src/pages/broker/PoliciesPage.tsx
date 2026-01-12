import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrokerSubscriptions } from "@/components/BrokerSubscriptions";
import { BrokerQuotations } from "@/components/BrokerQuotations";
import { PendingQuotationsTable } from "@/components/policies/PendingQuotationsTable";
import { RenewalPipelineTable } from "@/components/policies/RenewalPipelineTable";
import { RenewalStatusToggles, ContactFilterType, RenewalFilterType } from "@/components/policies/RenewalStatusToggles";
import { ProductSelector, ProductType } from "@/components/broker/dashboard/ProductSelector";
import { FileText, FolderOpen, Clock, Calendar, Search, RotateCcw } from "lucide-react";

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState("policies");
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("all");
  const [contactFilter, setContactFilter] = useState<ContactFilterType>("all");
  const [renewalFilter, setRenewalFilter] = useState<RenewalFilterType>("all");
  const [renewalSearch, setRenewalSearch] = useState("");

  // Fetch pending quotations count
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-quotations-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("quotations")
        .select("*", { count: "exact", head: true })
        .eq("broker_id", user.id)
        .eq("payment_status", "pending_payment");

      if (error) return 0;
      return count || 0;
    },
  });

  // Fetch renewals with counts
  const { data: renewalsData } = useQuery({
    queryKey: ["renewals-data-with-counts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total: 0, contactCounts: { all: 0, contacted: 0, not_contacted: 0 }, renewalCounts: { all: 0, renewed: 0, pending: 0, lost: 0 } };

      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select("contact_status, renewal_status")
        .eq("assigned_broker_id", user.id)
        .lte("end_date", threeMonthsFromNow.toISOString());

      if (error) return { total: 0, contactCounts: { all: 0, contacted: 0, not_contacted: 0 }, renewalCounts: { all: 0, renewed: 0, pending: 0, lost: 0 } };

      const total = subscriptions?.length || 0;
      
      // Calculate contact counts
      const contacted = subscriptions?.filter(s => s.contact_status && s.contact_status !== "not_contacted").length || 0;
      const not_contacted = subscriptions?.filter(s => !s.contact_status || s.contact_status === "not_contacted").length || 0;
      
      // Calculate renewal counts
      const renewed = subscriptions?.filter(s => s.renewal_status === "renewed").length || 0;
      const pending = subscriptions?.filter(s => !s.renewal_status || s.renewal_status === "pending").length || 0;
      const lost = subscriptions?.filter(s => s.renewal_status === "lost").length || 0;

      return {
        total,
        contactCounts: { all: total, contacted, not_contacted },
        renewalCounts: { all: total, renewed, pending, lost }
      };
    },
  });

  const renewalsCount = renewalsData?.total || 0;

  // Check if any renewal filters are active
  const hasActiveRenewalFilters = useMemo(() => {
    return renewalSearch !== "" || selectedProduct !== "all" || contactFilter !== "all" || renewalFilter !== "all";
  }, [renewalSearch, selectedProduct, contactFilter, renewalFilter]);

  const handleResetRenewalFilters = () => {
    setRenewalSearch("");
    setSelectedProduct("all");
    setContactFilter("all");
    setRenewalFilter("all");
  };

  return (
    <Card className="border-0 sm:border shadow-none sm:shadow-sm">
      <CardHeader className="px-0 sm:px-6 pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Gestion</CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="policies" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Polices</span>
              <span className="sm:hidden">Pol.</span>
            </TabsTrigger>
            <TabsTrigger value="quotations" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Cotations</span>
              <span className="sm:hidden">Cot.</span>
            </TabsTrigger>
            <TabsTrigger value="renewals" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Renouvellements</span>
              <span className="sm:hidden">Renouv.</span>
              {renewalsCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-amber-100 text-amber-700">
                  {renewalsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">En attente</span>
              <span className="sm:hidden">Att.</span>
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="policies">
            <BrokerSubscriptions />
          </TabsContent>
          
          <TabsContent value="quotations">
            <BrokerQuotations />
          </TabsContent>

          <TabsContent value="renewals" className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={renewalSearch}
                onChange={(e) => setRenewalSearch(e.target.value)}
                placeholder="Rechercher par client, n° police, immatriculation..."
                className="pl-9 h-9"
              />
            </div>

            {/* Product Selector and Filters */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <ProductSelector
                value={selectedProduct}
                onChange={setSelectedProduct}
              />
              <RenewalStatusToggles
                contactFilter={contactFilter}
                renewalFilter={renewalFilter}
                onContactFilterChange={setContactFilter}
                onRenewalFilterChange={setRenewalFilter}
                counts={{
                  contact: renewalsData?.contactCounts,
                  renewal: renewalsData?.renewalCounts,
                }}
              />
            </div>

            {/* Results Counter + Reset */}
            <div className="flex items-center justify-between text-sm border-b pb-2">
              <span className="text-muted-foreground">
                {renewalsCount} renouvellement{renewalsCount > 1 ? "s" : ""} à traiter
              </span>
              {hasActiveRenewalFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetRenewalFilters}
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  Réinitialiser
                </Button>
              )}
            </div>
            
            {/* Renewal Pipeline Table */}
            <RenewalPipelineTable
              selectedProduct={selectedProduct}
              contactFilter={contactFilter}
              renewalFilter={renewalFilter}
              searchQuery={renewalSearch}
            />
          </TabsContent>

          <TabsContent value="pending">
            <PendingQuotationsTable />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
