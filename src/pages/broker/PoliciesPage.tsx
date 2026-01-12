import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BrokerSubscriptions } from "@/components/BrokerSubscriptions";
import { BrokerQuotations } from "@/components/BrokerQuotations";
import { PendingQuotationsTable } from "@/components/policies/PendingQuotationsTable";
import { RenewalPipelineTable } from "@/components/policies/RenewalPipelineTable";
import { RenewalStatusToggles } from "@/components/policies/RenewalStatusToggles";
import { ProductSelector, ProductType } from "@/components/broker/dashboard/ProductSelector";
import { FileText, FolderOpen, Clock, Calendar } from "lucide-react";

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState("policies");
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("all");
  const [contactFilter, setContactFilter] = useState<"all" | "contacted" | "not_contacted">("all");
  const [renewalFilter, setRenewalFilter] = useState<"all" | "renewed" | "pending" | "lost">("all");

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

  // Fetch renewals count (expiring within 3 months)
  const { data: renewalsCount = 0 } = useQuery({
    queryKey: ["renewals-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      const { count, error } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("assigned_broker_id", user.id)
        .lte("end_date", threeMonthsFromNow.toISOString());

      if (error) return 0;
      return count || 0;
    },
  });

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
              Polices
            </TabsTrigger>
            <TabsTrigger value="quotations" className="gap-2">
              <FileText className="h-4 w-4" />
              Cotations
            </TabsTrigger>
            <TabsTrigger value="renewals" className="gap-2">
              <Calendar className="h-4 w-4" />
              Renouvellements
              {renewalsCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-amber-100 text-amber-700">
                  {renewalsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              En attente
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
              />
            </div>
            
            {/* Renewal Pipeline Table */}
            <RenewalPipelineTable
              selectedProduct={selectedProduct}
              contactFilter={contactFilter}
              renewalFilter={renewalFilter}
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
