import { DashboardKPIs } from "@/components/broker/dashboard/DashboardKPIs";
import { LeadsPipeline } from "@/components/broker/dashboard/LeadsPipeline";

interface Props {
  agentId: string;
  dateRange?: { from: Date; to: Date };
}

export const AgentOverviewTab = ({ agentId, dateRange }: Props) => {
  return (
    <div className="space-y-6">
      <DashboardKPIs overrideAgentId={agentId} />
      <LeadsPipeline overrideAgentId={agentId} dateRange={dateRange} />
    </div>
  );
};