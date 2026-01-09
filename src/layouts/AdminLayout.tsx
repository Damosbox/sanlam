import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/Header";

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SidebarProvider defaultOpen={true}>
        <div className="flex w-full min-h-[calc(100vh-4rem)]">
          <AdminSidebar />
          <SidebarInset className="flex-1">
            <div className="flex items-center gap-2 px-4 py-2 border-b sticky top-16 bg-background z-10">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm text-muted-foreground">
                Administration
              </span>
            </div>
            <main className="p-6">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
