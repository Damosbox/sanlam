import { AdminAnalytics } from "@/components/AdminAnalytics";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border">
        <h1 className="text-2xl font-bold mb-2">Tableau de Bord Administration</h1>
        <p className="text-muted-foreground">
          Bienvenue dans le panneau d'administration. Suivez les KPIs et gérez toutes les opérations.
        </p>
      </div>
      
      <AdminAnalytics />
    </div>
  );
}
