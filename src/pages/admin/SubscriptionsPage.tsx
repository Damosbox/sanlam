import { AdminSubscriptionsTable } from "@/components/AdminSubscriptionsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ApprovalsTable, usePendingApprovalsCount } from "@/components/admin/approvals/ApprovalsTable";

export default function SubscriptionsPage() {
  const pendingCount = usePendingApprovalsCount("subscription");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des Souscriptions</h1>
        <p className="text-muted-foreground">
          Consultez et gérez toutes les souscriptions clients.
        </p>
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Souscriptions</TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            Approbations en attente
            {pendingCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="subscriptions">
          <AdminSubscriptionsTable />
        </TabsContent>
        <TabsContent value="approvals">
          <ApprovalsTable source="subscription" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
