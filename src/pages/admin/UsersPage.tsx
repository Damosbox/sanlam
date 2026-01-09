import { AdminUsersTable } from "@/components/AdminUsersTable";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
        <p className="text-muted-foreground">
          Gérez les comptes utilisateurs, leurs rôles et leurs accès.
        </p>
      </div>
      
      <AdminUsersTable />
    </div>
  );
}
