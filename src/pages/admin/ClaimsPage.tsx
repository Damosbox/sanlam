import { AdminClaimsTable } from "@/components/AdminClaimsTable";

export default function ClaimsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des Sinistres</h1>
        <p className="text-muted-foreground">
          Consultez et gérez tous les sinistres déclarés.
        </p>
      </div>
      
      <AdminClaimsTable />
    </div>
  );
}
