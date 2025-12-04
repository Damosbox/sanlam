import { DashboardHeader } from "@/components/broker/dashboard/DashboardHeader";
import { DashboardKPIs } from "@/components/broker/dashboard/DashboardKPIs";
import { TasksReminders } from "@/components/broker/dashboard/TasksReminders";
import { LeadsPipeline } from "@/components/broker/dashboard/LeadsPipeline";
import { ActivityFeed } from "@/components/broker/dashboard/ActivityFeed";
import { AIRecommendations } from "@/components/broker/dashboard/AIRecommendations";
import { QuickActions } from "@/components/broker/dashboard/QuickActions";

const DashboardPage = () => {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl animate-fade-in px-1 sm:px-0">
      {/* 1. Header Premium + Actions rapides */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
        <DashboardHeader />
        <QuickActions />
      </div>
      
      {/* 2. KPIs Prioritaires - 4 cartes */}
      <DashboardKPIs />
      
      {/* 3. Actions du jour (priorité absolue) */}
      <TasksReminders />
      
      {/* 4. Pipeline + Recommandations IA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <LeadsPipeline />
          <ActivityFeed />
        </div>
        <AIRecommendations />
      </div>
    </div>
  );
};

export default DashboardPage;
