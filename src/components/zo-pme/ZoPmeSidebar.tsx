import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  CreditCard,
  FileBarChart,
  FileCheck2,
  Gift,
  Handshake,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { SpaceSwitcher } from "@/components/broker/SpaceSwitcher";
import { useZoPme } from "@/components/zo-pme/ZoPmeProvider";
import type { ZoPmeView } from "@/data/zoPme";

type Item = { title: string; vue: ZoPmeView; icon: typeof BarChart3 };

const groups: { label: string; items: Item[] }[] = [
  {
    label: "Programme PME",
    items: [
      { title: "Pilotage", vue: "pilotage", icon: BarChart3 },
      { title: "Souscription", vue: "souscription", icon: FileCheck2 },
    ],
  },
  {
    label: "Gestion du programme",
    items: [
      { title: "Membres", vue: "membres", icon: Users },
      { title: "Cartes", vue: "cartes", icon: CreditCard },
    ],
  },
  {
    label: "Écosystème",
    items: [
      { title: "Partenaires", vue: "partenaires", icon: Handshake },
      { title: "Avantages", vue: "avantages", icon: Gift },
      { title: "Animation", vue: "animation", icon: Megaphone },
      { title: "Rapports", vue: "rapports", icon: FileBarChart },
    ],
  },
  {
    label: "Administration",
    items: [{ title: "Droits & rôles", vue: "administration", icon: ShieldCheck }],
  },
];

export function ZoPmeSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { canSeeView, roleDefinition } = useZoPme();
  const collapsed = state === "collapsed";

  const currentVue =
    new URLSearchParams(location.search).get("vue") ?? roleDefinition.views[0];

  // Seules les vues du périmètre du rôle sont proposées.
  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => canSeeView(i.vue)) }))
    .filter((g) => g.items.length > 0);

  const handleNavigation = (vue: string) => {
    navigate(`/b2b/zo-pme?vue=${vue}`);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-2 border-border/70 shadow-[1px_0_0_0_hsl(var(--border)/0.4)] z-50"
    >
      <SidebarHeader className="p-3 sm:p-4 border-b border-border/50 bg-[hsl(var(--sidebar-broker))]">
        <SpaceSwitcher current="zo-pme" />
      </SidebarHeader>

      <SidebarContent className="py-4 bg-[hsl(var(--sidebar-broker))]">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className={cn(collapsed && "sr-only")}>
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = currentVue === item.vue;
                  return (
                    <SidebarMenuItem key={item.vue}>
                      <SidebarMenuButton
                        onClick={() => handleNavigation(item.vue)}
                        tooltip={item.title}
                        className={cn(
                          "w-full justify-start gap-3 transition-all duration-200 relative",
                          isActive &&
                            "bg-primary/10 text-primary font-semibold shadow-sm before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r before:bg-primary"
                        )}
                      >
                        <AnimatedIcon
                          icon={item.icon}
                          className={cn(
                            "h-5 w-5 shrink-0 transition-colors duration-200",
                            isActive && "text-primary"
                          )}
                        />
                        {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50 bg-[hsl(var(--sidebar-broker))]">
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center">v2.1 • Zô PME</div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
