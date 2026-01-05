import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Settings, BarChart3, Send } from "lucide-react";
import { AdminSurveyTemplates } from "./AdminSurveyTemplates";
import { AdminSurveyRules } from "./AdminSurveyRules";
import { AdminSurveyStats } from "./AdminSurveyStats";
import { AdminSurveySends } from "./AdminSurveySends";

export const AdminSurveys = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Enquêtes de satisfaction</h2>
        <p className="text-muted-foreground">
          Configurez des enquêtes automatisées pour les clients et intermédiaires
        </p>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Modèles
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Règles de déclenchement
          </TabsTrigger>
          <TabsTrigger value="sends" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Historique des envois
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <AdminSurveyTemplates />
        </TabsContent>

        <TabsContent value="rules">
          <AdminSurveyRules />
        </TabsContent>

        <TabsContent value="sends">
          <AdminSurveySends />
        </TabsContent>

        <TabsContent value="stats">
          <AdminSurveyStats />
        </TabsContent>
      </Tabs>
    </div>
  );
};
