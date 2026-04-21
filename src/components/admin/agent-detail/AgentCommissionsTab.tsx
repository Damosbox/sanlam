import { CommissionsView } from "@/pages/broker/CommissionsPage";

interface Props { agentId: string; }

export const AgentCommissionsTab = ({ agentId }: Props) => {
  return <CommissionsView agentId={agentId} hideHeader />;
};