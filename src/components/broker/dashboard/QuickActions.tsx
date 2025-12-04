import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  UserPlus, FileText, Zap, Package, 
  FolderOpen, MessageSquare, HelpCircle, MoreHorizontal
} from "lucide-react";

const primaryActions = [
  { label: "Nouveau Lead", icon: UserPlus, route: "/b2b/leads", variant: "default" as const },
  { label: "Devis rapide", icon: FileText, route: "/b2b/sales", variant: "outline" as const },
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
