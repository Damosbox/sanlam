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
import { BarChart3, CreditCard, Handshake, Megaphone, FileBarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { SpaceSwitcher } from "@/components/broker/SpaceSwitcher";

const items = [
  { title: "Pilotage", vue: "pilotage", icon: BarChart3 },
  { title: "Membres & cartes", vue: "membres", icon: CreditCard },
  { title: "Partenaires & avantages", vue: "partenaires", icon: Handshake },
  { title: "Animation", vue: "animation", icon: Megaphone },
  { title: "Rapports", vue: "rapports", icon: FileBarChart },
];

export function ZoPmeSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";

  const currentVue = new URLSearchParams(location.search).get("vue") ?? "pilotage";

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
        <SidebarGroup>
          <SidebarGroupLabel className={cn(collapsed && "sr-only")}>Programme PME</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
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
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50 bg-[hsl(var(--sidebar-broker))]">
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center">v2.1 • Zô PME</div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
