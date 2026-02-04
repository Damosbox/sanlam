import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  LayoutDashboard,
  Users,
  UserPlus,
  Zap,
  FileText,
  Shield,
  RefreshCw,
  PieChart,
  FileBarChart,
  MessageSquare,
  Newspaper,
  Megaphone,
  Sparkles,
  FileSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface BadgeCounts {
  newLeads: number;
  pendingClaims: number;
  renewalsCount: number;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  disabled?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function BrokerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const [badges, setBadges] = useState<BadgeCounts>({
    newLeads: 0,
    pendingClaims: 0,
    renewalsCount: 0,
  });

  useEffect(() => {
    fetchBadgeCounts();

    const leadsChannel = supabase
      .channel("leads-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () =>
        fetchBadgeCounts()
      )
      .subscribe();

    const claimsChannel = supabase
      .channel("claims-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "claims" }, () =>
        fetchBadgeCounts()
      )
      .subscribe();

    const subsChannel = supabase
      .channel("subscriptions-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, () =>
        fetchBadgeCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(claimsChannel);
      supabase.removeChannel(subsChannel);
    };
  }, []);

  const fetchBadgeCounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count: leadsCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("assigned_broker_id", user.id)
        .eq("status", "nouveau");

      const { count: claimsCount } = await supabase
        .from("claims")
        .select("*", { count: "exact", head: true })
        .eq("assigned_broker_id", user.id)
        .eq("status", "Submitted");

      // Count subscriptions expiring within 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count: renewalsCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("assigned_broker_id", user.id)
        .eq("renewal_status", "pending")
        .lte("end_date", thirtyDaysFromNow.toISOString());

      setBadges({
        newLeads: leadsCount || 0,
        pendingClaims: claimsCount || 0,
        renewalsCount: renewalsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching badge counts:", error);
    }
  };

  const isActive = (path: string) => {
    if (path.includes("?")) {
      const basePath = path.split("?")[0];
      const searchParams = new URLSearchParams(path.split("?")[1]);
      const tabParam = searchParams.get("tab");
      const currentSearchParams = new URLSearchParams(location.search);
      const currentTab = currentSearchParams.get("tab");
      return location.pathname === basePath && currentTab === tabParam;
    }
    return location.pathname === path;
  };

  const navigationGroups: NavGroup[] = [
    {
      label: "Accueil",
      items: [
        { title: "Tableau de bord", url: "/b2b/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "Mon Portefeuille",
      items: [
        { 
          title: "Clients", 
          url: "/b2b/portfolio?tab=clients", 
          icon: Users,
        },
        { 
          title: "Prospects", 
          url: "/b2b/portfolio?tab=prospects", 
          icon: UserPlus,
          badge: badges.newLeads > 0 ? badges.newLeads : undefined,
        },
      ],
    },
    {
      label: "Vente",
      items: [
        { title: "Nouvelle Vente", url: "/b2b/sales", icon: Zap },
      ],
    },
    {
      label: "Gestion",
      items: [
        { 
          title: "Sinistres", 
          url: "/b2b/claims", 
          icon: FileText,
          badge: badges.pendingClaims > 0 ? badges.pendingClaims : undefined,
        },
        { title: "Polices", url: "/b2b/policies", icon: Shield },
        { title: "Cotations", url: "/b2b/policies?tab=quotations", icon: FileSearch },
        { 
          title: "Renouvellement", 
          url: "/b2b/renewals", 
          icon: RefreshCw,
          badge: badges.renewalsCount > 0 ? badges.renewalsCount : undefined,
        },
      ],
    },
    {
      label: "Performances",
      items: [
        { title: "Statistiques", url: "/b2b/stats", icon: PieChart },
        { title: "Rapports", url: "/b2b/reports", icon: FileBarChart, disabled: true },
      ],
    },
    {
      label: "Communications",
      items: [
        { title: "Messages", url: "/b2b/messages", icon: MessageSquare },
        { title: "Actualités", url: "/b2b/news", icon: Newspaper },
        { title: "Campagnes", url: "/b2b/campaigns", icon: Megaphone, disabled: true },
      ],
    },
  ];

  const handleNavigation = (url: string) => {
    navigate(url);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const renderMenuItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        onClick={() => !item.disabled && handleNavigation(item.url)}
        className={cn(
          "w-full justify-start gap-3 transition-all duration-200",
          isActive(item.url) && "bg-primary/10 text-primary font-medium border-l-2 border-primary",
          item.disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="relative">
          <item.icon className={cn("h-4 w-4", isActive(item.url) && "text-primary")} />
          {collapsed && item.badge && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
          )}
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.title}</span>
            {item.badge && (
              <Badge
                variant="secondary"
                className={cn(
                  "h-5 min-w-[20px] px-1.5 text-xs font-semibold",
                  "bg-destructive/10 text-destructive border border-destructive/20",
                  "animate-fade-in"
                )}
              >
                {item.badge}
              </Badge>
            )}
            {item.disabled && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                Bientôt
              </Badge>
            )}
          </>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 z-50">
      <SidebarHeader className="p-3 sm:p-4 border-b border-border/50 bg-primary-foreground">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="font-semibold text-sm truncate">Espace Courtier</h2>
              <p className="text-xs text-muted-foreground truncate">Sanlam Allianz</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4 bg-primary-foreground">
        {navigationGroups.map((group, groupIndex) => (
          <SidebarGroup key={group.label}>
            {groupIndex > 0 && (
              <SidebarGroupLabel className={cn(collapsed && "sr-only")}>
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>{group.items.map(renderMenuItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50 bg-primary-foreground">
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center">
            v2.1 • Navigation Pro
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
