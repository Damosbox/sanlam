import { RefreshCw } from "lucide-react";
import { RenewalsImportCard } from "@/components/renewals/RenewalsImportCard";
import { RenewalsPipelineCard } from "@/components/renewals/RenewalsPipelineCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ApprovalsTable, usePendingApprovalsCount } from "@/components/admin/approvals/ApprovalsTable";

export default function AdminRenewalsPage() {
  const pendingCount = usePendingApprovalsCount("renewal");
  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Renouvellements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pipeline, suivi et import des renouvellements
          </p>
        </div>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            Approbations en attente
            {pendingCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="space-y-6">
          <RenewalsImportCard />
          <RenewalsPipelineCard scope="admin" />
        </TabsContent>
        <TabsContent value="approvals">
          <ApprovalsTable source="renewal" />
        </TabsContent>
      </Tabs>
    </div>
  );
}