import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Medal, AlertTriangle, Trophy } from "lucide-react";

interface AgentMetric {
  name: string;
  value: string;
}

interface TopBottomAgentsProps {
  title?: string;
  metricLabel: string;
  topAgents: AgentMetric[];
  bottomAgents: AgentMetric[];
  invertBottom?: boolean; // if true, bottom = worst (high value is bad)
}

const MEDAL_COLORS = [
  "text-yellow-500", // gold
  "text-gray-400",   // silver
  "text-amber-700",  // bronze
];

export function TopBottomAgents({
  title = "Classement Agents",
  metricLabel,
  topAgents,
  bottomAgents,
}: TopBottomAgentsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top 3 */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              🏆 Top 3 — {metricLabel}
            </p>
            <div className="space-y-2">
              {topAgents.map((agent, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Medal className={`h-4 w-4 ${MEDAL_COLORS[i] || "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">{agent.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{agent.value}</span>
                </div>
              ))}
              {topAgents.length === 0 && (
                <p className="text-xs text-muted-foreground">Aucune donnée</p>
              )}
            </div>
          </div>

          {/* Bottom 3 */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              ⚠️ À améliorer — {metricLabel}
            </p>
            <div className="space-y-2">
              {bottomAgents.map((agent, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">{agent.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{agent.value}</span>
                </div>
              ))}
              {bottomAgents.length === 0 && (
                <p className="text-xs text-muted-foreground">Aucune donnée</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
