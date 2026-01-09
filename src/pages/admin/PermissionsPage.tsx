import { AdminPermissions } from "@/components/admin/AdminPermissions";

export default function PermissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des Permissions</h1>
        <p className="text-muted-foreground">
          Configurez les permissions par rôle pour contrôler l'accès aux fonctionnalités.
        </p>
      </div>
      
      <AdminPermissions />
    </div>
  );
}
