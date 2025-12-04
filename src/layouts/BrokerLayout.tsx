import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { BrokerSidebar } from "@/components/broker/BrokerSidebar";
import { Header } from "@/components/Header";
import { Separator } from "@/components/ui/separator";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

function MobileMenuButton() {
  const { toggleSidebar, isMobile } = useSidebar();

  if (!isMobile) {
    return <SidebarTrigger className="-ml-1" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="h-8 w-8"
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Menu</span>
    </Button>
  );
}

function BrokerLayoutContent() {
  return (
    <div className="flex w-full min-h-[calc(100vh-4rem)]">
      <BrokerSidebar />
      <SidebarInset className="flex-1">
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <MobileMenuButton />
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
          <span className="text-xs sm:text-sm text-muted-foreground truncate">
            Espace Courtier
          </span>
        </div>
        
        <main className="p-3 sm:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </div>
  );
}

export function BrokerLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SidebarProvider defaultOpen={true}>
        <BrokerLayoutContent />
      </SidebarProvider>
    </div>
  );
}
