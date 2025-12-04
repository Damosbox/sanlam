import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Phone, Calendar, FileWarning, RefreshCw, 
  ChevronRight, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  type: "lead_relance" | "quote_expiring" | "claim_pending" | "renewal";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  action: string;
  route?: string;
}

const priorityConfig = {
  high: { dot: "bg-destructive", text: "text-destructive" },
  medium: { dot: "bg-warning", text: "text-warning" },
  low: { dot: "bg-primary", text: "text-primary" },
};

const typeIcons = {
  lead_relance: Phone,
  quote_expiring: Calendar,
  claim_pending: FileWarning,
  renewal: RefreshCw,
};

export const TasksReminders = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const generatedTasks: Task[] = [];

      // Leads à relancer
      const { data: leadsToFollow } = await supabase
        .from("leads")
        .select("id, first_name, last_name")
        .eq("assigned_broker_id", user.id)
        .eq("status", "relance")
        .limit(3);

      leadsToFollow?.forEach((lead) => {
        generatedTasks.push({
          id: `lead-${lead.id}`,
          type: "lead_relance",
          title: `Relancer ${lead.first_name} ${lead.last_name}`,
          description: "Lead en attente",
          priority: "high",
          action: "Relancer",
          route: "/b2b/leads",
        });
      });

      // Sinistres en attente
      const { data: pendingClaims } = await supabase
        .from("claims")
        .select("id, claim_type")
        .eq("assigned_broker_id", user.id)
        .eq("status", "Submitted")
        .limit(2);

      pendingClaims?.forEach((claim) => {
        generatedTasks.push({
          id: `claim-${claim.id}`,
          type: "claim_pending",
          title: `Sinistre ${claim.claim_type}`,
          description: "Action requise",
          priority: "medium",
          action: "Examiner",
          route: "/b2b/claims",
        });
      });

      // Renouvellements
      generatedTasks.push({
        id: "renewal-1",
        type: "renewal",
        title: "3 polices expirent bientôt",
        description: "Ce mois-ci",
        priority: "medium",
        action: "Voir",
        route: "/b2b/policies",
      });

      setTasks(generatedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleAction = (task: Task) => {
    if (task.route) {
      navigate(task.route);
    }
  };

  const remainingCount = tasks.length - completedTasks.size;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            Tes actions du jour
          </CardTitle>
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs font-medium",
              remainingCount === 0 ? "bg-success/10 text-success" : "bg-muted"
            )}
          >
            {remainingCount === 0 ? (
              <><CheckCircle2 className="w-3 h-3 mr-1" /> Terminé</>
            ) : (
              `${remainingCount} restante${remainingCount > 1 ? "s" : ""}`
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2.5">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="w-2 h-2 rounded-full" />
                <Skeleton className="w-4 h-4 rounded hidden sm:block" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-7 w-16" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aucune action prioritaire 🎉
          </p>
        ) : (
          <div className="space-y-1.5">
            {tasks.map((task, index) => {
              const Icon = typeIcons[task.type];
              const isCompleted = completedTasks.has(task.id);
              
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-muted/50 group",
                    isCompleted && "opacity-50"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="shrink-0"
                  />
                  <div className={cn(
                    "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0",
                    priorityConfig[task.priority].dot
                  )} />
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0 hidden sm:block" />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs sm:text-sm font-medium truncate",
                      isCompleted && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {task.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAction(task)}
                    disabled={isCompleted}
                    className="h-6 sm:h-7 text-[10px] sm:text-xs px-1.5 sm:px-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <span className="hidden sm:inline">{task.action}</span>
                    <ChevronRight className="w-3 h-3 sm:ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
