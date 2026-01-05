import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BrokerSubscriptions } from "@/components/BrokerSubscriptions";
import { BrokerQuotations } from "@/components/BrokerQuotations";
import { PendingQuotationsTable } from "@/components/policies/PendingQuotationsTable";
import { FileText, FolderOpen, Clock } from "lucide-react";

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState("policies");

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

  return (
    <Card className="border-0 sm:border shadow-none sm:shadow-sm">
      <CardHeader className="px-0 sm:px-6 pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Gestion</CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="policies" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Polices
            </TabsTrigger>
            <TabsTrigger value="quotations" className="gap-2">
              <FileText className="h-4 w-4" />
              Cotations
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

          <TabsContent value="pending">
            <PendingQuotationsTable />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
