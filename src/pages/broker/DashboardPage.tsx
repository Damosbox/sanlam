import { DashboardHeader } from "@/components/broker/dashboard/DashboardHeader";
import { DashboardKPIs } from "@/components/broker/dashboard/DashboardKPIs";
import { LeadsPipeline } from "@/components/broker/dashboard/LeadsPipeline";
import { TasksReminders } from "@/components/broker/dashboard/TasksReminders";
import { ActivityFeed } from "@/components/broker/dashboard/ActivityFeed";
import { AIRecommendations } from "@/components/broker/dashboard/AIRecommendations";
import { QuickActions } from "@/components/broker/dashboard/QuickActions";

const DashboardPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Premium */}
      <DashboardHeader />
      
      {/* KPIs Grid */}
      <DashboardKPIs />
      
      {/* Pipeline + Quick Actions */}
      <div className="space-y-6">
        <LeadsPipeline />
        <QuickActions />
      </div>
      
      {/* Two Column Layout: Tasks + Activity + AI */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <TasksReminders />
          <ActivityFeed />
        </div>
        <div>
          <AIRecommendations />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
