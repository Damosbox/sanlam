import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { BrokerSidebar } from "@/components/broker/BrokerSidebar";
import { Header } from "@/components/Header";
import { BrokerAnalytics } from "@/components/BrokerAnalytics";
import { BrokerAIInsights } from "@/components/BrokerAIInsights";
import { Separator } from "@/components/ui/separator";

export function BrokerLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SidebarProvider defaultOpen={true}>
        <div className="flex w-full min-h-[calc(100vh-4rem)]">
          <BrokerSidebar />
          <SidebarInset className="flex-1">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm text-muted-foreground">Espace Courtier</span>
            </div>
            
            <main className="p-6 space-y-6">
              {/* Analytics Overview */}
              <BrokerAnalytics />
              
              {/* Page Content */}
              <Outlet />
              
              {/* AI Insights */}
              <BrokerAIInsights />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
