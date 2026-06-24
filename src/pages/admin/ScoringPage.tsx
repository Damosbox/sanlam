import { Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoringJobMonitor } from "@/components/admin/scoring/ScoringJobMonitor";
import { ScoringManualOverrideTable } from "@/components/admin/scoring/ScoringManualOverrideTable";

export default function ScoringPage() {
  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Scoring client (VF_v2)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pilotage du moteur de scoring et du programme de fidélité.
          </p>
        </div>
      </div>

      <Tabs defaultValue="monitoring">
        <TabsList>
          <TabsTrigger value="monitoring">Monitoring du job</TabsTrigger>
          <TabsTrigger value="override">Modifications manuelles</TabsTrigger>
        </TabsList>
        <TabsContent value="monitoring" className="mt-4">
          <ScoringJobMonitor />
        </TabsContent>
        <TabsContent value="override" className="mt-4">
          <ScoringManualOverrideTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}