import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  UserPlus, FileText, Zap, Package, 
  FolderOpen, MessageSquare, HelpCircle, MoreHorizontal,
  Database, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const primaryActions = [
  { label: "Devis rapide", icon: FileText, route: "/b2b/sales", variant: "default" as const },
];

const moreActions = [
  { label: "Vente guidée", icon: Zap, route: "/b2b/sales" },
  { label: "Catalogue produits", icon: Package, route: "/b2b/policies" },
  { label: "Documents", icon: FolderOpen, route: "/b2b/clients" },
  { label: "Messages", icon: MessageSquare, route: "/b2b/messages" },
  { label: "Support", icon: HelpCircle, route: "/b2b/messages" },
];

export const QuickActions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const generateMockData = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      const { data, error } = await supabase.functions.invoke('create-mock-clients', {
        body: { brokerId: user.id }
      });

      if (error || data?.success === false) {
        throw new Error(data?.error || error?.message || "Erreur");
      }

      toast({
        title: "✅ Données générées",
        description: data.message,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {primaryActions.map((action) => (
        <Button
          key={action.label}
          variant={action.variant}
          size="sm"
          onClick={() => navigate(action.route)}
          className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2.5 sm:px-3 transition-all duration-200 hover:scale-[1.02]"
        >
          <action.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{action.label}</span>
        </Button>
      ))}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 sm:h-9 px-2">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Plus d'actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {moreActions.map((action) => (
            <DropdownMenuItem
              key={action.label}
              onClick={() => navigate(action.route)}
              className="gap-2 cursor-pointer"
            >
              <action.icon className="h-4 w-4 text-muted-foreground" />
              {action.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={generateMockData}
            disabled={generating}
            className="gap-2 cursor-pointer text-blue-600 dark:text-blue-400"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {generating ? "Génération..." : "Générer données test"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
