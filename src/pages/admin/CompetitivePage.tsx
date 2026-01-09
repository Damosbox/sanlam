import { CompetitiveAnalyzer } from "@/components/CompetitiveAnalyzer";

export default function CompetitivePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analyse Concurrentielle</h1>
        <p className="text-muted-foreground">
          Analysez les offres concurrentes et identifiez vos avantages compétitifs.
        </p>
      </div>
      
      <CompetitiveAnalyzer />
    </div>
  );
}
