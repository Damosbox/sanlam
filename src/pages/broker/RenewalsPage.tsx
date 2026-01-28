import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductSelector, ProductType } from "@/components/broker/dashboard/ProductSelector";
import { RenewalPipelineTable } from "@/components/policies/RenewalPipelineTable";
import { RenewalStatusToggles } from "@/components/policies/RenewalStatusToggles";
import { ContactIndicatorsTable } from "@/components/broker/stats/ContactIndicatorsTable";
import { RenewalDecisionCharts } from "@/components/broker/stats/RenewalDecisionCharts";
import { Calendar, PieChart, TrendingUp, RefreshCw } from "lucide-react";

export default function RenewalsPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("all");
  const [activeTab, setActiveTab] = useState("pipeline");
  const [contactFilter, setContactFilter] = useState<"all" | "contacted" | "not_contacted">("all");
  const [renewalFilter, setRenewalFilter] = useState<"all" | "renewed" | "pending" | "lost">("all");

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      {/* Header with Product Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Renouvellement</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Pipeline et suivi des renouvellements
            </p>
          </div>
        </div>
        <ProductSelector value={selectedProduct} onChange={setSelectedProduct} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600">76%</div>
            <div className="text-xs text-muted-foreground mt-1">Taux renouvellement</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">82%</div>
            <div className="text-xs text-muted-foreground mt-1">Clients atteints</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-amber-600">24</div>
            <div className="text-xs text-muted-foreground mt-1">À contacter</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-red-600">8%</div>
            <div className="text-xs text-muted-foreground mt-1">Taux churn</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pipeline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="indicators" className="gap-2">
            <PieChart className="h-4 w-4" />
            Indicateurs
          </TabsTrigger>
        </TabsList>

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

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContactIndicatorsTable selectedProduct={selectedProduct} />
            <RenewalDecisionCharts selectedProduct={selectedProduct} />
          </div>
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
