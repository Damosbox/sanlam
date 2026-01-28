import { useState } from "react";
import { DashboardHeader } from "@/components/broker/dashboard/DashboardHeader";
import { DashboardKPIs } from "@/components/broker/dashboard/DashboardKPIs";
import { TasksReminders } from "@/components/broker/dashboard/TasksReminders";
import { AIRecommendations } from "@/components/broker/dashboard/AIRecommendations";
import { QuickActions } from "@/components/broker/dashboard/QuickActions";
import { ContactIndicatorsCard } from "@/components/broker/dashboard/ContactIndicatorsCard";
import { NewsBanner } from "@/components/broker/dashboard/NewsBanner";
import type { ProductType } from "@/components/broker/dashboard/ProductSelector";

const DashboardPage = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductType>("all");

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl animate-fade-in px-1 sm:px-0">
      {/* 1. Header Premium + Product Selector + Actions rapides */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
        <DashboardHeader 
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
        />
        <QuickActions />
      </div>
      
      {/* 2. KPIs Prioritaires - Taux renouvellement + Stats */}
      <DashboardKPIs selectedProduct={selectedProduct} />
      
      {/* 3. Indicateurs de Contact */}
      <ContactIndicatorsCard selectedProduct={selectedProduct} />
      
      {/* 4. Actions du jour + Recommandations IA (Grid 2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TasksReminders />
        <AIRecommendations />
      </div>
      
      {/* 5. Bannière Actualité */}
      <NewsBanner />
    </div>
  );
};

export default DashboardPage;
