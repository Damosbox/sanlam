import { RefreshCw } from "lucide-react";
import { RenewalsImportCard } from "@/components/renewals/RenewalsImportCard";
import { RenewalsPipelineCard } from "@/components/renewals/RenewalsPipelineCard";

export default function AdminRenewalsPage() {
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

      <RenewalsImportCard />
      <RenewalsPipelineCard scope="admin" />
    </div>
  );
}