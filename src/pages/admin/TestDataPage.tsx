import { AdminDataGenerator } from "@/components/AdminDataGenerator";

export default function TestDataPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Données de Test</h1>
        <p className="text-muted-foreground">
          Générez des données fictives pour tester l'application.
        </p>
      </div>
      
      <AdminDataGenerator />
    </div>
  );
}
