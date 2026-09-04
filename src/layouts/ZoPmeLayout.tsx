import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ZoPmeSidebar } from "@/components/zo-pme/ZoPmeSidebar";
import { ZoPmeProvider } from "@/components/zo-pme/ZoPmeProvider";
import { Header } from "@/components/Header";
import { BrokerAIChatWidget } from "@/components/broker/BrokerAIChatWidget";

function ZoPmeLayoutContent() {
  return (
    <div className="flex w-full min-h-screen">
      <ZoPmeSidebar />
      <SidebarInset className="flex-1 min-w-0 flex flex-col">
        <Header />
        <main className="flex-1 p-3 sm:p-6 w-full">
          <Outlet />
        </main>
      </SidebarInset>
    </div>
  );
}

export function ZoPmeLayout() {
  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider defaultOpen={true}>
        <ZoPmeLayoutContent />
      </SidebarProvider>
      <BrokerAIChatWidget />
    </div>
  );
}
