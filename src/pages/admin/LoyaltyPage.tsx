import { AdminLoyalty } from "@/components/admin/AdminLoyalty";

export default function LoyaltyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Programme de Fidélité</h1>
        <p className="text-muted-foreground">
          Gérez les missions, récompenses et statistiques du programme fidélité.
        </p>
      </div>
      
      <AdminLoyalty />
    </div>
  );
}
