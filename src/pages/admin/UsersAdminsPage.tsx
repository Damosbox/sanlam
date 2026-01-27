import { AdminUsersTable } from "@/components/AdminUsersTable";

export default function UsersAdminsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs Administrateurs</h1>
        <p className="text-muted-foreground">
          Gérez les comptes des administrateurs de la plateforme.
        </p>
      </div>
      <AdminUsersTable roleFilter="admin" />
    </div>
  );
}
