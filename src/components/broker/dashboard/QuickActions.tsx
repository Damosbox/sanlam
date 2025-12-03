import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, Zap, FileText, FolderOpen, 
  MessageSquare, HelpCircle, Package
} from "lucide-react";

const actions = [
  { label: "Nouveau Lead", icon: UserPlus, route: "/b2b/leads", variant: "default" as const },
  { label: "Vente Guidée", icon: Zap, route: "/b2b/sales", variant: "outline" as const },
  { label: "Devis Rapide", icon: FileText, route: "/b2b/sales", variant: "outline" as const },
  { label: "Catalogue Produits", icon: Package, route: "/b2b/policies", variant: "outline" as const },
  { label: "Documents", icon: FolderOpen, route: "/b2b/clients", variant: "outline" as const },
  { label: "Messages", icon: MessageSquare, route: "/b2b/messages", variant: "outline" as const },
  { label: "Support", icon: HelpCircle, route: "/b2b/messages", variant: "ghost" as const },
];

export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Actions rapides</h2>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            size="sm"
            onClick={() => navigate(action.route)}
            className="gap-2 rounded-full px-4"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
