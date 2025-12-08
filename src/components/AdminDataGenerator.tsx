import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AdminDataGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const generateMockClients = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Récupérer l'ID de l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Vous devez être connecté");
      }

      const { data, error } = await supabase.functions.invoke('create-mock-clients', {
        body: { brokerId: user.id }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message || "Impossible de générer les clients",
        });
        setResult({ success: false, error: error.message });
      } else if (data?.success === false) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: data.error || "Impossible de générer les clients",
        });
        setResult(data);
      } else {
        toast({
          title: "✅ Données générées",
          description: data.message || "Les clients mock ont été créés avec succès",
        });
        setResult(data);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message || "Une erreur est survenue",
      });
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Générateur de Données Test
        </CardTitle>
        <CardDescription>
          Créez des clients, sinistres et polices de test pour le broker B2B
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted">
          <h4 className="font-medium mb-2">🎭 Clients Mock avec Sinistres & Polices</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Génère 3 clients avec profils, 1 police active chacun et 2-3 sinistres variés (Auto, Santé, Habitation)
          </p>
          <Button 
            onClick={generateMockClients} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Générer Données Test
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'}`}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium mb-1">
                  {result.success ? 'Succès' : 'Erreur'}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  {result.message || result.error}
                </p>
                {result.results && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium">Clients créés:</p>
                    {result.results.map((r: any, i: number) => (
                      <div key={i} className="text-xs flex items-center gap-2">
                        {r.success ? '✅' : '❌'}
                        <span>{r.email}</span>
                        {r.policyNumber && <span className="text-muted-foreground">({r.policyNumber})</span>}
                        {r.claimsCreated && <span className="text-muted-foreground">- {r.claimsCreated} sinistres</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="font-medium mb-1">ℹ️ Informations</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Emails: marie.dupont@test.com, jean.kouassi@test.com, etc.</li>
            <li>Mot de passe: Test1234!</li>
            <li>Broker assigné: Vous (utilisateur connecté)</li>
            <li>Données: 2-3 sinistres par client + 1 police active</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
