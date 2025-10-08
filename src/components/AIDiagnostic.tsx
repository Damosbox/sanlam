import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, TrendingUp } from "lucide-react";

export const AIDiagnostic = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [profile, setProfile] = useState({
    age: "",
    familyStatus: "",
    profession: "",
    income: "",
    assets: "",
    needs: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-diagnostic', {
        body: { profile }
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
      toast({
        title: "Diagnostic terminé",
        description: `${data.recommendations?.length || 0} recommandations générées`,
      });
    } catch (error) {
      console.error('Diagnostic error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le diagnostic",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Diagnostic IA gratuit</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Obtenez des recommandations personnalisées basées sur votre profil
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Âge</Label>
              <Input
                id="age"
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                placeholder="35"
              />
            </div>
            <div>
              <Label htmlFor="familyStatus">Situation familiale</Label>
              <Input
                id="familyStatus"
                value={profile.familyStatus}
                onChange={(e) => setProfile({ ...profile, familyStatus: e.target.value })}
                placeholder="Marié(e), 2 enfants"
              />
            </div>
            <div>
              <Label htmlFor="profession">Profession</Label>
              <Input
                id="profession"
                value={profile.profession}
                onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
                placeholder="Commerçant"
              />
            </div>
            <div>
              <Label htmlFor="income">Revenus mensuels (FCFA)</Label>
              <Input
                id="income"
                value={profile.income}
                onChange={(e) => setProfile({ ...profile, income: e.target.value })}
                placeholder="250000"
              />
            </div>
            <div>
              <Label htmlFor="assets">Patrimoine</Label>
              <Input
                id="assets"
                value={profile.assets}
                onChange={(e) => setProfile({ ...profile, assets: e.target.value })}
                placeholder="Maison, Véhicule"
              />
            </div>
            <div>
              <Label htmlFor="needs">Besoins exprimés</Label>
              <Input
                id="needs"
                value={profile.needs}
                onChange={(e) => setProfile({ ...profile, needs: e.target.value })}
                placeholder="Protection santé famille"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Lancer le diagnostic
              </>
            )}
          </Button>
        </form>
      </Card>

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Recommandations personnalisées</h3>
          {recommendations.map((rec, idx) => (
            <Card key={idx} className="p-6 border-l-4 border-l-primary">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  rec.priority === 'high' ? 'bg-error/10 text-error' :
                  rec.priority === 'medium' ? 'bg-warning/10 text-warning' :
                  'bg-success/10 text-success'
                }`}>
                  {rec.priority === 'high' ? 'Prioritaire' : 
                   rec.priority === 'medium' ? 'Recommandé' : 'Optionnel'}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{rec.monthlyPremium}</span>
                </div>
              </div>
              <p className="text-sm bg-muted/50 p-3 rounded-lg">
                <strong>Pourquoi ?</strong> {rec.reason}
              </p>
              <Button className="w-full mt-4">Souscrire maintenant</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
