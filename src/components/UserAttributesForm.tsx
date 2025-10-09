import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Loader2 } from "lucide-react";

export const UserAttributesForm = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attributes, setAttributes] = useState({
    age_range: '',
    family_status: '',
    occupation_category: '',
    location: '',
    income_range: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_attributes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setAttributes({
          age_range: data.age_range || '',
          family_status: data.family_status || '',
          occupation_category: data.occupation_category || '',
          location: data.location || '',
          income_range: data.income_range || ''
        });
      }
    } catch (error) {
      console.error('Error fetching attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_attributes')
        .upsert({
          user_id: user.id,
          ...attributes
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos préférences ont été enregistrées avec succès"
      });

      // Refresh the page to reload recommendations
      window.location.reload();
    } catch (error) {
      console.error('Error saving attributes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos préférences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Complétez votre profil
        </CardTitle>
        <CardDescription>
          Ces informations nous aident à personnaliser vos recommandations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="age_range">Tranche d'âge</Label>
          <Select value={attributes.age_range} onValueChange={(v) => setAttributes({...attributes, age_range: v})}>
            <SelectTrigger id="age_range">
              <SelectValue placeholder="Sélectionnez votre âge" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="18-30">18-30 ans</SelectItem>
              <SelectItem value="31-50">31-50 ans</SelectItem>
              <SelectItem value="51+">51 ans et plus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="family_status">Situation familiale</Label>
          <Select value={attributes.family_status} onValueChange={(v) => setAttributes({...attributes, family_status: v})}>
            <SelectTrigger id="family_status">
              <SelectValue placeholder="Sélectionnez votre situation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Célibataire">Célibataire</SelectItem>
              <SelectItem value="Marié sans enfants">Marié sans enfants</SelectItem>
              <SelectItem value="Marié avec enfants">Marié avec enfants</SelectItem>
              <SelectItem value="Parent seul">Parent seul</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="occupation_category">Catégorie professionnelle</Label>
          <Select value={attributes.occupation_category} onValueChange={(v) => setAttributes({...attributes, occupation_category: v})}>
            <SelectTrigger id="occupation_category">
              <SelectValue placeholder="Sélectionnez votre profession" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Salarié">Salarié</SelectItem>
              <SelectItem value="Entrepreneur">Entrepreneur</SelectItem>
              <SelectItem value="Fonctionnaire">Fonctionnaire</SelectItem>
              <SelectItem value="Étudiant">Étudiant</SelectItem>
              <SelectItem value="Retraité">Retraité</SelectItem>
              <SelectItem value="Autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Localisation</Label>
          <Select value={attributes.location} onValueChange={(v) => setAttributes({...attributes, location: v})}>
            <SelectTrigger id="location">
              <SelectValue placeholder="Sélectionnez votre région" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Dakar">Dakar</SelectItem>
              <SelectItem value="Abidjan">Abidjan</SelectItem>
              <SelectItem value="Bamako">Bamako</SelectItem>
              <SelectItem value="Ouagadougou">Ouagadougou</SelectItem>
              <SelectItem value="Lomé">Lomé</SelectItem>
              <SelectItem value="Autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="income_range">Revenus mensuels</Label>
          <Select value={attributes.income_range} onValueChange={(v) => setAttributes({...attributes, income_range: v})}>
            <SelectTrigger id="income_range">
              <SelectValue placeholder="Sélectionnez votre tranche" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-200000">Moins de 200 000 FCFA</SelectItem>
              <SelectItem value="200000-500000">200 000 - 500 000 FCFA</SelectItem>
              <SelectItem value="500000-1000000">500 000 - 1 000 000 FCFA</SelectItem>
              <SelectItem value="1000000+">Plus de 1 000 000 FCFA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {saving ? 'Enregistrement...' : 'Enregistrer mon profil'}
        </Button>
      </CardContent>
    </Card>
  );
};