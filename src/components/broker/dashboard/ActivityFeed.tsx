import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, CreditCard, UserPlus, FileText, Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "policy" | "payment" | "lead" | "claim";
  title: string;
  timestamp: Date;
}

const activityConfig = {
  policy: { icon: Shield, color: "text-success" },
  payment: { icon: CreditCard, color: "text-primary" },
  lead: { icon: UserPlus, color: "text-warning" },
  claim: { icon: FileText, color: "text-accent" },
};

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          title: `Police ${sub.policy_number}`,
          timestamp: new Date(sub.created_at),
        });
      });

      // Recent leads
      const { data: leads } = await supabase
        .from("leads")
        .select("id, first_name, last_name, updated_at")
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
        .select("id, claim_type, updated_at")
        .eq("assigned_broker_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(2);

      claims?.forEach((claim) => {
        activityList.push({
          id: `claim-${claim.id}`,
          type: "claim",
          title: `Sinistre ${claim.claim_type}`,
          timestamp: new Date(claim.updated_at),
        });
      });

      activityList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(activityList.slice(0, 6));
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="flex-1 h-4" />
                <Skeleton className="w-16 h-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Conditional rendering - only show if data exists
  if (activities.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Activity className="h-4 w-4" />
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <ScrollArea className="h-[180px]">
          <div className="space-y-1">
            {activities.map((activity, index) => {
              const config = activityConfig[activity.type];
              const Icon = config.icon;
              
              return (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-center gap-3 py-2 px-2 rounded-md",
                    "hover:bg-muted/30 transition-colors duration-150"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {activity.title}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(activity.timestamp, { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
