import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BrokerSidebar } from "@/components/broker/BrokerSidebar";
import { Header } from "@/components/Header";
import { BrokerAIChatWidget } from "@/components/broker/BrokerAIChatWidget";

function BrokerLayoutContent() {
  return (
    <div className="flex w-full min-h-screen">
      <BrokerSidebar />
      <SidebarInset className="flex-1 min-w-0 flex flex-col">
        <Header />
        <main className="flex-1 p-3 sm:p-6 w-full">
          <Outlet />
        </main>
      </SidebarInset>
    </div>
  );
}

export function BrokerLayout() {
  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider defaultOpen={true}>
        <BrokerLayoutContent />
      </SidebarProvider>
      <BrokerAIChatWidget />
    </div>
  );
}
