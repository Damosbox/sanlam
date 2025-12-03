import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Inbox,
  Zap,
  FileText,
  Shield,
  Users,
  BarChart3,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const salesItems = [
  { title: "Leads", url: "/b2b/leads", icon: Inbox, badge: "3" },
  { title: "Vente Guidée", url: "/b2b/sales", icon: Zap },
];

const managementItems = [
  { title: "Sinistres", url: "/b2b/claims", icon: FileText },
  { title: "Polices", url: "/b2b/policies", icon: Shield },
  { title: "Clients", url: "/b2b/clients", icon: Users },
];

const toolsItems = [
  { title: "Analyse Concurrentielle", url: "/b2b/analysis", icon: BarChart3 },
  { title: "Messages", url: "/b2b/messages", icon: MessageSquare },
];

export function BrokerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  const renderMenuItem = (item: { title: string; url: string; icon: React.ComponentType<{ className?: string }>; badge?: string }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        onClick={() => navigate(item.url)}
        className={cn(
          "w-full justify-start gap-3 transition-all duration-200",
          isActive(item.url) &&
            "bg-primary/10 text-primary font-medium border-l-2 border-primary"
        )}
      >
        <item.icon className={cn("h-4 w-4", isActive(item.url) && "text-primary")} />
        {!collapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-primary/20 text-primary">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4 border-b border-border/50">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-sm">Espace Courtier</h2>
              <p className="text-xs text-muted-foreground">Sanlam Allianz</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={cn(collapsed && "sr-only")}>
            Vente
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {salesItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={cn(collapsed && "sr-only")}>
            Gestion
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={cn(collapsed && "sr-only")}>
            Outils
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center">
            v2.0 • Navigation Pro
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
