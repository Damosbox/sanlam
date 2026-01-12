import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Inbox, Zap, FileText, Shield, Users, BarChart3, MessageSquare, Sparkles, LayoutDashboard, Newspaper, Briefcase, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
interface BadgeCounts {
  newLeads: number;
  pendingClaims: number;
}
export function BrokerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    state
  } = useSidebar();
  const collapsed = state === "collapsed";
  const [badges, setBadges] = useState<BadgeCounts>({
    newLeads: 0,
    pendingClaims: 0
  });
  useEffect(() => {
    fetchBadgeCounts();

    // Set up real-time subscriptions
    const leadsChannel = supabase.channel("leads-changes").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "leads"
    }, () => fetchBadgeCounts()).subscribe();
    const claimsChannel = supabase.channel("claims-changes").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "claims"
    }, () => fetchBadgeCounts()).subscribe();
    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(claimsChannel);
    };
  }, []);
  const fetchBadgeCounts = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch new leads count
      const {
        count: leadsCount
      } = await supabase.from("leads").select("*", {
        count: "exact",
        head: true
      }).eq("assigned_broker_id", user.id).eq("status", "nouveau");

      // Fetch pending claims count
      const {
        count: claimsCount
      } = await supabase.from("claims").select("*", {
        count: "exact",
        head: true
      }).eq("assigned_broker_id", user.id).eq("status", "Submitted");
      setBadges({
        newLeads: leadsCount || 0,
        pendingClaims: claimsCount || 0
      });
    } catch (error) {
      console.error("Error fetching badge counts:", error);
    }
  };
  const isActive = (path: string) => location.pathname === path;
  const dashboardItem = {
    title: "Tableau de Bord",
    url: "/b2b/dashboard",
    icon: LayoutDashboard
  };
  const portfolioItem = {
    title: "Mon Portefeuille",
    url: "/b2b/portfolio",
    icon: Briefcase,
    badge: badges.newLeads > 0 ? badges.newLeads.toString() : undefined
  };
  const salesItems = [{
    title: "Vente Guidée",
    url: "/b2b/sales",
    icon: Zap
  }];
  const managementItems = [{
    title: "Sinistres",
    url: "/b2b/claims",
    icon: FileText,
    badge: badges.pendingClaims > 0 ? badges.pendingClaims.toString() : undefined
  }, {
    title: "Polices",
    url: "/b2b/policies",
    icon: Shield
  }, {
    title: "Statistiques",
    url: "/b2b/stats",
    icon: PieChart
  }];
  const toolsItems = [{
    title: "Analyse Concurrentielle",
    url: "/b2b/analysis",
    icon: BarChart3
  }, {
    title: "Messages",
    url: "/b2b/messages",
    icon: MessageSquare
  }, {
    title: "Actualité",
    url: "/courtiers",
    icon: Newspaper
  }];
  const {
    isMobile,
    setOpenMobile
  } = useSidebar();
  const handleNavigation = (url: string) => {
    navigate(url);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  const renderMenuItem = (item: {
    title: string;
    url: string;
    icon: React.ComponentType<{
      className?: string;
    }>;
    badge?: string;
  }) => <SidebarMenuItem key={item.title}>
      <SidebarMenuButton onClick={() => handleNavigation(item.url)} className={cn("w-full justify-start gap-3 transition-all duration-200", isActive(item.url) && "bg-primary/10 text-primary font-medium border-l-2 border-primary")}>
        <div className="relative">
          <item.icon className={cn("h-4 w-4", isActive(item.url) && "text-primary")} />
          {collapsed && item.badge && <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />}
        </div>
        {!collapsed && <>
            <span className="flex-1 truncate">{item.title}</span>
            {item.badge && <Badge variant="secondary" className={cn("h-5 min-w-[20px] px-1.5 text-xs font-semibold", "bg-destructive/10 text-destructive border border-destructive/20", "animate-fade-in")}>
                {item.badge}
              </Badge>}
          </>}
      </SidebarMenuButton>
    </SidebarMenuItem>;
  return <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-3 sm:p-4 border-b border-border/50 bg-primary-foreground">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && <div className="min-w-0">
              <h2 className="font-semibold text-sm truncate">Espace Courtier</h2>
              <p className="text-xs text-muted-foreground truncate">Sanlam Allianz</p>
            </div>}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4 bg-primary-foreground">
        {/* Dashboard - Main Entry */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItem(dashboardItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItem(portfolioItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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

      <SidebarFooter className="p-4 border-t border-border/50 bg-primary-foreground">
        {!collapsed && <div className="text-xs text-muted-foreground text-center">
            v2.0 • Navigation Pro
          </div>}
      </SidebarFooter>
    </Sidebar>;
}