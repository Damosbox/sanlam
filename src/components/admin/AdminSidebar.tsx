import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, TrendingUp, Users, KeyRound, ScrollText, Trophy,
  ClipboardList, Brain, Shield, Database, Settings, Briefcase, Newspaper,
  UserCheck, Package, Calculator, Variable, PieChart, ArrowRightLeft,
  ShieldCheck, Target, AlertTriangle, ChevronDown,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import LogoutButton from "@/components/LogoutButton";

interface BadgeCounts {
  pendingClaims: number;
  newClients: number;
  newPartners: number;
  newAdmins: number;
}

const STORAGE_KEY = "admin-sidebar-sections";

function useSectionState(sections: string[]) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return Object.fromEntries(sections.map((s) => [s, true]));
  });

  const toggle = (key: string) => {
    setOpenSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { openSections, toggle };
}

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const [badges, setBadges] = useState<BadgeCounts>({ pendingClaims: 0, newClients: 0, newPartners: 0, newAdmins: 0 });

  const sectionKeys = ["operations", "access", "commercial", "portfolio", "risk", "engagement", "config", "dev"];
  const { openSections, toggle } = useSectionState(sectionKeys);

  useEffect(() => {
    fetchBadgeCounts();
    const ch = supabase.channel("admin-claims-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "claims" }, fetchBadgeCounts)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const fetchBadgeCounts = async () => {
    const { count: pendingClaims } = await supabase.from("claims").select("*", { count: "exact", head: true }).in("status", ["Submitted", "Draft"]);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: newProfiles } = await supabase.from("profiles").select("id").gte("created_at", sevenDaysAgo);
    const roleCounts = { customer: 0, broker: 0, admin: 0 };
    if (newProfiles && newProfiles.length > 0) {
      for (const profile of newProfiles) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", profile.id).limit(1);
        const role = (roles?.[0]?.role as keyof typeof roleCounts) || "customer";
        if (role in roleCounts) roleCounts[role]++;
      }
    }
    setBadges({ pendingClaims: pendingClaims || 0, newClients: roleCounts.customer, newPartners: roleCounts.broker, newAdmins: roleCounts.admin });
  };

  const handleNavigation = (url: string) => {
    navigate(url);
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (url: string) => location.pathname === url || location.pathname.startsWith(url + "/");

  const renderMenuItem = (item: { title: string; url: string; icon: React.ElementType; badge?: number }) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton onClick={() => handleNavigation(item.url)} isActive={isActive(item.url)} tooltip={collapsed ? item.title : undefined} className="cursor-pointer">
        <item.icon className="h-4 w-4" />
        {!collapsed && <span className="flex-1">{item.title}</span>}
        {item.badge && item.badge > 0 && (
          <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground min-w-[18px]">{item.badge}</span>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const renderCollapsibleGroup = (key: string, label: string, items: { title: string; url: string; icon: React.ElementType; badge?: number }[]) => (
    <SidebarGroup key={key}>
      {collapsed ? (
        <>
          <SidebarGroupLabel />
          <SidebarGroupContent>
            <SidebarMenu>{items.map(renderMenuItem)}</SidebarMenu>
          </SidebarGroupContent>
        </>
      ) : (
        <Collapsible open={openSections[key] !== false} onOpenChange={() => toggle(key)}>
          <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
            {label}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections[key] !== false ? "" : "-rotate-90"}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>{items.map(renderMenuItem)}</SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      )}
    </SidebarGroup>
  );

  const groups = [
    { key: "operations", label: "Opérations", items: [
      { title: "Sinistres", url: "/admin/claims", icon: FileText, badge: badges.pendingClaims },
      { title: "Souscriptions", url: "/admin/subscriptions", icon: TrendingUp },
    ]},
    { key: "access", label: "Accès & Utilisateurs", items: [
      { title: "Clients", url: "/admin/users/clients", icon: Users, badge: badges.newClients },
      { title: "Agents", url: "/admin/users/partners", icon: Briefcase, badge: badges.newPartners },
      { title: "Administrateurs", url: "/admin/users/admins", icon: UserCheck, badge: badges.newAdmins },
      { title: "Permissions", url: "/admin/permissions", icon: KeyRound },
      { title: "Audit", url: "/admin/audit", icon: ScrollText },
    ]},
    { key: "commercial", label: "Pilotage — Commercial", items: [
      { title: "Conversions", url: "/admin/conversions", icon: ArrowRightLeft },
      { title: "Performance Agents", url: "/admin/agent-performance", icon: Target },
    ]},
    { key: "portfolio", label: "Pilotage — Portefeuille", items: [
      { title: "Portefeuille Agents", url: "/admin/agents-portfolio", icon: PieChart },
    ]},
    { key: "risk", label: "Pilotage — Risque", items: [
      { title: "Sinistralité", url: "/admin/loss-ratio", icon: AlertTriangle },
      { title: "Conformité KYC", url: "/admin/compliance", icon: ShieldCheck },
    ]},
    { key: "engagement", label: "Engagement", items: [
      { title: "Fidélité", url: "/admin/loyalty", icon: Trophy },
      { title: "Enquêtes", url: "/admin/surveys", icon: ClipboardList },
    ]},
    { key: "config", label: "Configuration", items: [
      { title: "Produits", url: "/admin/products", icon: Package },
      { title: "Règles de calcul", url: "/admin/calc-rules", icon: Calculator },
      { title: "Variables", url: "/admin/calc-variables", icon: Variable },
      { title: "Formulaires", url: "/admin/forms", icon: Settings },
      { title: "Templates Documents", url: "/admin/document-templates", icon: FileText },
      { title: "Actualités Broker", url: "/admin/broker-news", icon: Newspaper },
      { title: "Monitoring IA", url: "/admin/ai", icon: Brain },
      { title: "Concurrence", url: "/admin/competitive", icon: Shield },
    ]},
    { key: "dev", label: "Développement", items: [
      { title: "Données Test", url: "/admin/data", icon: Database },
    ]},
  ];

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
        {/* Dashboard - always visible */}
        <SidebarGroup>
          <SidebarMenu>
            {renderMenuItem({ title: "Tableau de Bord", url: "/admin/dashboard", icon: LayoutDashboard })}
          </SidebarMenu>
        </SidebarGroup>

        {groups.map((g) => renderCollapsibleGroup(g.key, g.label, g.items))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  );
}
