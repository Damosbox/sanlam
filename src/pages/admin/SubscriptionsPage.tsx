import { AdminSubscriptionsTable } from "@/components/AdminSubscriptionsTable";

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des Souscriptions</h1>
        <p className="text-muted-foreground">
          Consultez et gérez toutes les souscriptions clients.
        </p>
      </div>
      
      <AdminSubscriptionsTable />
    </div>
  );
}
