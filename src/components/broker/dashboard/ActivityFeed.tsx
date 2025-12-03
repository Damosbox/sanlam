import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, CreditCard, CheckCircle, 
  UserPlus, MessageSquare, Shield, Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "policy" | "payment" | "quote" | "lead" | "claim" | "message";
  title: string;
  timestamp: Date;
}

const activityConfig = {
  policy: { icon: Shield, color: "text-green-500", bgColor: "bg-green-500/10" },
  payment: { icon: CreditCard, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  quote: { icon: CheckCircle, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  lead: { icon: UserPlus, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  claim: { icon: FileText, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  message: { icon: MessageSquare, color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
};

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const activityList: ActivityItem[] = [];

      // Recent subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("id, policy_number, created_at")
        .eq("assigned_broker_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      subscriptions?.forEach((sub) => {
        activityList.push({
          id: `sub-${sub.id}`,
          type: "policy",
          title: `Nouvelle police ${sub.policy_number}`,
          timestamp: new Date(sub.created_at),
        });
      });

      // Recent leads
      const { data: leads } = await supabase
        .from("leads")
        .select("id, first_name, last_name, status, updated_at")
        .eq("assigned_broker_id", user.id)
        .eq("status", "converti")
        .order("updated_at", { ascending: false })
        .limit(2);

      leads?.forEach((lead) => {
        activityList.push({
          id: `lead-${lead.id}`,
          type: "lead",
          title: `Lead converti: ${lead.first_name} ${lead.last_name}`,
          timestamp: new Date(lead.updated_at),
        });
      });

      // Recent claims
      const { data: claims } = await supabase
        .from("claims")
        .select("id, claim_type, status, updated_at")
        .eq("assigned_broker_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(2);

      claims?.forEach((claim) => {
        activityList.push({
          id: `claim-${claim.id}`,
          type: "claim",
          title: `Sinistre ${claim.claim_type} - ${claim.status}`,
          timestamp: new Date(claim.updated_at),
        });
      });

      // Sort by timestamp
      activityList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setActivities(activityList.slice(0, 8));
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune activité récente
            </p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
              
              <div className="space-y-4">
                {activities.map((activity, index) => {
                  const config = activityConfig[activity.type];
                  const Icon = config.icon;
                  
                  return (
                    <div
                      key={activity.id}
                      className={cn(
                        "relative flex gap-4 pl-2 animate-fade-in",
                        index === 0 && "pt-0"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={cn(
                        "relative z-10 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-background",
                        config.bgColor
                      )}>
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-medium text-foreground">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(activity.timestamp, { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
