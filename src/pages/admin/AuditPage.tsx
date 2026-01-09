import { AdminAuditLogs } from "@/components/admin/AdminAuditLogs";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Journal d'Audit</h1>
        <p className="text-muted-foreground">
          Consultez l'historique des actions effectuées dans le système.
        </p>
      </div>
      
      <AdminAuditLogs />
    </div>
  );
}
