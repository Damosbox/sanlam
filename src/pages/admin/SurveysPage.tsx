import { AdminSurveys } from "@/components/admin/AdminSurveys";

export default function SurveysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des Enquêtes</h1>
        <p className="text-muted-foreground">
          Créez et gérez les enquêtes de satisfaction et NPS.
        </p>
      </div>
      
      <AdminSurveys />
    </div>
  );
}
