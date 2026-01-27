import { AdminUsersTable } from "@/components/AdminUsersTable";

export default function UsersClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs Clients</h1>
        <p className="text-muted-foreground">
          Gérez les comptes des clients particuliers.
        </p>
      </div>
      <AdminUsersTable roleFilter="customer" />
    </div>
  );
}
