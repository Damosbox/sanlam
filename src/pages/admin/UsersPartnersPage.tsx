import { AdminUsersTable } from "@/components/AdminUsersTable";

export default function UsersPartnersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs Partenaires</h1>
        <p className="text-muted-foreground">
          Gérez les comptes des courtiers et agents.
        </p>
      </div>
      <AdminUsersTable roleFilter="broker" />
    </div>
  );
}
