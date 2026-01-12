import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductSelector, ProductType } from "@/components/broker/dashboard/ProductSelector";
import { RenewalPipelineTable } from "@/components/policies/RenewalPipelineTable";
import { RenewalStatusToggles } from "@/components/policies/RenewalStatusToggles";
import { ContactIndicatorsTable } from "@/components/broker/stats/ContactIndicatorsTable";
import { RenewalDecisionCharts } from "@/components/broker/stats/RenewalDecisionCharts";
import { Calendar, PieChart, TrendingUp } from "lucide-react";

export default function RenewalStatsPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [contactFilter, setContactFilter] = useState<"all" | "contacted" | "not_contacted">("all");
  const [renewalFilter, setRenewalFilter] = useState<"all" | "renewed" | "pending" | "lost">("all");

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      {/* Header with Product Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Statistiques Renouvellement</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi des renouvellements et indicateurs de contact
          </p>
        </div>
        <ProductSelector
          value={selectedProduct}
          onChange={setSelectedProduct}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="indicators" className="gap-2">
            <PieChart className="h-4 w-4" />
            Indicateurs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Indicators Summary */}
            <ContactIndicatorsTable selectedProduct={selectedProduct} />
            
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Résumé</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-lg text-center">
                  <div className="text-3xl font-bold text-emerald-700">76%</div>
                  <div className="text-xs text-emerald-600 mt-1">Taux renouvellement</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-700">82%</div>
                  <div className="text-xs text-blue-600 mt-1">Clients atteints</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg text-center">
                  <div className="text-3xl font-bold text-amber-700">24</div>
                  <div className="text-xs text-amber-600 mt-1">À contacter</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-700">8%</div>
                  <div className="text-xs text-red-600 mt-1">Taux churn</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Decision Charts */}
          <RenewalDecisionCharts selectedProduct={selectedProduct} />
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base font-semibold">
                  Pipeline des Renouvellements
                </CardTitle>
                <RenewalStatusToggles
                  contactFilter={contactFilter}
                  renewalFilter={renewalFilter}
                  onContactFilterChange={setContactFilter}
                  onRenewalFilterChange={setRenewalFilter}
                />
              </div>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <RenewalPipelineTable
                selectedProduct={selectedProduct}
                contactFilter={contactFilter}
                renewalFilter={renewalFilter}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Indicators Tab */}
        <TabsContent value="indicators" className="space-y-6">
          <ContactIndicatorsTable selectedProduct={selectedProduct} showDetails />
          <RenewalDecisionCharts selectedProduct={selectedProduct} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
