import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Users,
  KeyRound,
  ScrollText,
  Trophy,
  ClipboardList,
  Brain,
  Shield,
  Database,
  Settings,
  Briefcase,
  Newspaper,
  UserCheck,
  Package,
  Calculator,
  Variable,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import LogoutButton from "@/components/LogoutButton";

interface BadgeCounts {
  pendingClaims: number;
  newClients: number;
  newPartners: number;
  newAdmins: number;
}

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const [badges, setBadges] = useState<BadgeCounts>({ 
    pendingClaims: 0, 
    newClients: 0, 
    newPartners: 0, 
    newAdmins: 0 
  });

  useEffect(() => {
    fetchBadgeCounts();

    const claimsChannel = supabase
      .channel("admin-claims-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "claims" }, fetchBadgeCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(claimsChannel);
    };
  }, []);

  const fetchBadgeCounts = async () => {
    const { count: pendingClaims } = await supabase
      .from("claims")
      .select("*", { count: "exact", head: true })
      .in("status", ["Submitted", "Draft"]);

    // Fetch new profiles from the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: newProfiles } = await supabase
      .from("profiles")
      .select("id")
      .gte("created_at", sevenDaysAgo);

    // Count by role
    const roleCounts = { customer: 0, broker: 0, admin: 0 };
    
    if (newProfiles && newProfiles.length > 0) {
      for (const profile of newProfiles) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.id)
          .limit(1);
        
        const role = (roles?.[0]?.role as keyof typeof roleCounts) || "customer";
        if (role in roleCounts) {
          roleCounts[role]++;
        }
      }
    }

    setBadges({
      pendingClaims: pendingClaims || 0,
      newClients: roleCounts.customer,
      newPartners: roleCounts.broker,
      newAdmins: roleCounts.admin,
    });
  };

  const dashboardItem = {
    title: "Tableau de Bord",
    url: "/admin/dashboard",
    icon: LayoutDashboard,
  };

  const operationsItems = [
    { title: "Sinistres", url: "/admin/claims", icon: FileText, badge: badges.pendingClaims },
    { title: "Souscriptions", url: "/admin/subscriptions", icon: TrendingUp },
  ];

  const usersItems = [
    { title: "Clients", url: "/admin/users/clients", icon: Users, badge: badges.newClients },
    { title: "Partenaires", url: "/admin/users/partners", icon: Briefcase, badge: badges.newPartners },
    { title: "Administrateurs", url: "/admin/users/admins", icon: UserCheck, badge: badges.newAdmins },
  ];

  const securityItems = [
    { title: "Permissions", url: "/admin/permissions", icon: KeyRound },
    { title: "Audit", url: "/admin/audit", icon: ScrollText },
  ];

  const engagementItems = [
    { title: "Fidélité", url: "/admin/loyalty", icon: Trophy },
    { title: "Enquêtes", url: "/admin/surveys", icon: ClipboardList },
  ];

  const configItems = [
    { title: "Produits", url: "/admin/products", icon: Package },
    { title: "Règles de calcul", url: "/admin/calc-rules", icon: Calculator },
    { title: "Variables", url: "/admin/calc-variables", icon: Variable },
    { title: "Formulaires", url: "/admin/forms", icon: Settings },
    { title: "Actualités Broker", url: "/admin/broker-news", icon: Newspaper },
    { title: "Monitoring IA", url: "/admin/ai", icon: Brain },
    { title: "Concurrence", url: "/admin/competitive", icon: Shield },
  ];

  const devItems = [
    { title: "Données Test", url: "/admin/data", icon: Database },
  ];

  const handleNavigation = (url: string) => {
    navigate(url);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isActive = (url: string) => location.pathname === url || location.pathname.startsWith(url + "/");

  const renderMenuItem = (item: { title: string; url: string; icon: React.ElementType; badge?: number }) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton
        onClick={() => handleNavigation(item.url)}
        isActive={isActive(item.url)}
        tooltip={collapsed ? item.title : undefined}
        className="cursor-pointer"
      >
        <item.icon className="h-4 w-4" />
        {!collapsed && <span>{item.title}</span>}
      </SidebarMenuButton>
      {item.badge && item.badge > 0 && (
        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-semibold text-sm">Admin Panel</p>
              <p className="text-xs text-muted-foreground">Sanlam Assurance</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            {renderMenuItem(dashboardItem)}
          </SidebarMenu>
        </SidebarGroup>

        {/* Opérations */}
        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && "Opérations"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Utilisateurs */}
        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && "Utilisateurs"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {usersItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sécurité */}
        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && "Sécurité"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {securityItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Engagement */}
        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && "Engagement"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {engagementItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configuration */}
        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && "Configuration"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Développement */}
        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && "Développement"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {devItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  );
}
