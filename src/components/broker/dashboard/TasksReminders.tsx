import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Phone, Eye, AlertCircle, Calendar, 
  FileWarning, CreditCard, RefreshCw 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  type: "lead_relance" | "quote_expiring" | "claim_pending" | "renewal" | "payment_failed";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  action: string;
  route?: string;
}

const priorityConfig = {
  high: { color: "border-l-red-500", badge: "bg-red-500/10 text-red-600" },
  medium: { color: "border-l-amber-500", badge: "bg-amber-500/10 text-amber-600" },
  low: { color: "border-l-blue-500", badge: "bg-blue-500/10 text-blue-600" },
};

const typeIcons = {
  lead_relance: Phone,
  quote_expiring: Calendar,
  claim_pending: FileWarning,
  renewal: RefreshCw,
  payment_failed: CreditCard,
};

export const TasksReminders = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

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
          description: "Lead en attente de relance",
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
          title: `Sinistre ${claim.claim_type} à examiner`,
          description: "Action requise",
          priority: "medium",
          action: "Voir",
          route: "/b2b/claims",
        });
      });

      // Renouvellements (mock for now)
      generatedTasks.push({
        id: "renewal-1",
        type: "renewal",
        title: "3 polices expirent ce mois",
        description: "Clients à contacter",
        priority: "medium",
        action: "Voir",
        route: "/b2b/policies",
      });

      setTasks(generatedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Tâches & Rappels
          </CardTitle>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {tasks.length - completedTasks.size} restantes
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune tâche prioritaire 🎉
          </p>
        ) : (
          tasks.map((task) => {
            const Icon = typeIcons[task.type];
            const isCompleted = completedTasks.has(task.id);
            
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-l-4 bg-muted/30 transition-all duration-200",
                  priorityConfig[task.priority].color,
                  isCompleted && "opacity-50"
                )}
              >
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={() => toggleTask(task.id)}
                />
                <div className={cn("p-2 rounded-lg", priorityConfig[task.priority].badge)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isCompleted && "line-through"
                  )}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAction(task)}
                  disabled={isCompleted}
                >
                  {task.action}
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
