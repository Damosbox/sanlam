import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Save, User, Briefcase, MapPin, Car, Shield, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";

interface AdditionalDataSectionProps {
  leadId: string;
}

interface AdditionalData {
  birth_date: string | null;
  gender: string | null;
  marital_status: string | null;
  children_count: number;
  socio_professional_category: string | null;
  profession: string | null;
  employer: string | null;
  monthly_income_range: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  has_drivers_license: boolean;
  drivers_license_date: string | null;
  vehicle_count: number;
  property_owner: boolean;
  property_type: string | null;
  existing_insurances: string[];
  current_insurer: string | null;
  preferred_contact_method: string;
  preferred_contact_time: string | null;
  referral_source: string | null;
  loyalty_program_interest: boolean;
}

const defaultData: AdditionalData = {
  birth_date: null,
  gender: null,
  marital_status: null,
  children_count: 0,
  socio_professional_category: null,
  profession: null,
  employer: null,
  monthly_income_range: null,
  address: null,
  city: null,
  postal_code: null,
  country: "Sénégal",
  has_drivers_license: false,
  drivers_license_date: null,
  vehicle_count: 0,
  property_owner: false,
  property_type: null,
  existing_insurances: [],
  current_insurer: null,
  preferred_contact_method: "phone",
  preferred_contact_time: null,
  referral_source: null,
  loyalty_program_interest: false,
};

const maritalStatusOptions = [
  { value: "celibataire", label: "Célibataire" },
  { value: "marie", label: "Marié(e)" },
  { value: "divorce", label: "Divorcé(e)" },
  { value: "veuf", label: "Veuf/Veuve" },
  { value: "concubinage", label: "Concubinage" },
];

const genderOptions = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
  { value: "autre", label: "Autre" },
];

const socioProOptions = [
  { value: "cadre", label: "Cadre" },
  { value: "employe", label: "Employé" },
  { value: "ouvrier", label: "Ouvrier" },
  { value: "artisan", label: "Artisan/Commerçant" },
  { value: "profession_liberale", label: "Profession libérale" },
  { value: "fonctionnaire", label: "Fonctionnaire" },
  { value: "retraite", label: "Retraité" },
  { value: "etudiant", label: "Étudiant" },
  { value: "sans_emploi", label: "Sans emploi" },
  { value: "entrepreneur", label: "Entrepreneur" },
];

const incomeOptions = [
  { value: "moins_100k", label: "Moins de 100 000 FCFA" },
  { value: "100k_300k", label: "100 000 - 300 000 FCFA" },
  { value: "300k_500k", label: "300 000 - 500 000 FCFA" },
  { value: "500k_1m", label: "500 000 - 1 000 000 FCFA" },
  { value: "1m_3m", label: "1 000 000 - 3 000 000 FCFA" },
  { value: "plus_3m", label: "Plus de 3 000 000 FCFA" },
];

const propertyTypeOptions = [
  { value: "appartement", label: "Appartement" },
  { value: "maison", label: "Maison" },
  { value: "terrain", label: "Terrain" },
];

const insuranceTypeOptions = [
  { value: "auto", label: "Auto" },
  { value: "habitation", label: "Habitation" },
  { value: "sante", label: "Santé" },
  { value: "vie", label: "Vie" },
  { value: "voyage", label: "Voyage" },
];

const contactMethodOptions = [
  { value: "phone", label: "Téléphone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
];

const contactTimeOptions = [
  { value: "matin", label: "Matin (8h-12h)" },
  { value: "midi", label: "Midi (12h-14h)" },
  { value: "apres_midi", label: "Après-midi (14h-18h)" },
  { value: "soir", label: "Soir (18h-21h)" },
  { value: "weekend", label: "Week-end" },
];

const referralSourceOptions = [
  { value: "bouche_a_oreille", label: "Bouche à oreille" },
  { value: "publicite", label: "Publicité" },
  { value: "reseaux_sociaux", label: "Réseaux sociaux" },
  { value: "site_web", label: "Site web" },
  { value: "partenaire", label: "Partenaire" },
  { value: "autre", label: "Autre" },
];

export function AdditionalDataSection({ leadId }: AdditionalDataSectionProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AdditionalData>(defaultData);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: existingData, isLoading } = useQuery({
    queryKey: ["lead-additional-data", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_additional_data")
        .select("*")
        .eq("lead_id", leadId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existingData) {
      setFormData({
        birth_date: existingData.birth_date,
        gender: existingData.gender,
        marital_status: existingData.marital_status,
        children_count: existingData.children_count || 0,
        socio_professional_category: existingData.socio_professional_category,
        profession: existingData.profession,
        employer: existingData.employer,
        monthly_income_range: existingData.monthly_income_range,
        address: existingData.address,
        city: existingData.city,
        postal_code: existingData.postal_code,
        country: existingData.country || "Sénégal",
        has_drivers_license: existingData.has_drivers_license || false,
        drivers_license_date: existingData.drivers_license_date,
        vehicle_count: existingData.vehicle_count || 0,
        property_owner: existingData.property_owner || false,
        property_type: existingData.property_type,
        existing_insurances: existingData.existing_insurances || [],
        current_insurer: existingData.current_insurer,
        preferred_contact_method: existingData.preferred_contact_method || "phone",
        preferred_contact_time: existingData.preferred_contact_time,
        referral_source: existingData.referral_source,
        loyalty_program_interest: existingData.loyalty_program_interest || false,
      });
    }
  }, [existingData]);

  const saveMutation = useMutation({
    mutationFn: async (data: AdditionalData) => {
      if (existingData) {
        const { error } = await supabase
          .from("lead_additional_data")
          .update(data)
          .eq("lead_id", leadId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lead_additional_data")
          .insert({ ...data, lead_id: leadId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-additional-data", leadId] });
      toast.success("Données complémentaires enregistrées");
      setHasChanges(false);
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  const updateField = <K extends keyof AdditionalData>(field: K, value: AdditionalData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const toggleInsurance = (insurance: string) => {
    const current = formData.existing_insurances || [];
    const updated = current.includes(insurance)
      ? current.filter((i) => i !== insurance)
      : [...current, insurance];
    updateField("existing_insurances", updated);
  };

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6 p-1">
      {/* Informations personnelles */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <User className="h-4 w-4" />
          Informations personnelles
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Date de naissance</Label>
            <Input
              type="date"
              value={formData.birth_date || ""}
              onChange={(e) => updateField("birth_date", e.target.value || null)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Genre</Label>
            <Select value={formData.gender || ""} onValueChange={(v) => updateField("gender", v || null)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Situation familiale</Label>
            <Select value={formData.marital_status || ""} onValueChange={(v) => updateField("marital_status", v || null)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {maritalStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nombre d'enfants</Label>
            <Input
              type="number"
              min={0}
              value={formData.children_count}
              onChange={(e) => updateField("children_count", parseInt(e.target.value) || 0)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Informations professionnelles */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Briefcase className="h-4 w-4" />
          Situation socio-professionnelle
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Catégorie</Label>
            <Select value={formData.socio_professional_category || ""} onValueChange={(v) => updateField("socio_professional_category", v || null)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {socioProOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Profession</Label>
            <Input
              value={formData.profession || ""}
              onChange={(e) => updateField("profession", e.target.value || null)}
              placeholder="Ex: Comptable"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Employeur</Label>
            <Input
              value={formData.employer || ""}
              onChange={(e) => updateField("employer", e.target.value || null)}
              placeholder="Nom de l'entreprise"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Revenu mensuel</Label>
            <Select value={formData.monthly_income_range || ""} onValueChange={(v) => updateField("monthly_income_range", v || null)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {incomeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Localisation */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4" />
          Localisation
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Adresse</Label>
            <Input
              value={formData.address || ""}
              onChange={(e) => updateField("address", e.target.value || null)}
              placeholder="Rue, quartier..."
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ville</Label>
            <Input
              value={formData.city || ""}
              onChange={(e) => updateField("city", e.target.value || null)}
              placeholder="Dakar"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Pays</Label>
            <Input
              value={formData.country}
              onChange={(e) => updateField("country", e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Véhicules et patrimoine */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Car className="h-4 w-4" />
          Véhicules & Patrimoine
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 col-span-2">
            <Checkbox
              id="license"
              checked={formData.has_drivers_license}
              onCheckedChange={(c) => updateField("has_drivers_license", !!c)}
            />
            <Label htmlFor="license" className="text-xs cursor-pointer">Permis de conduire</Label>
          </div>
          {formData.has_drivers_license && (
            <div className="space-y-1">
              <Label className="text-xs">Date d'obtention</Label>
              <Input
                type="date"
                value={formData.drivers_license_date || ""}
                onChange={(e) => updateField("drivers_license_date", e.target.value || null)}
                className="h-9"
              />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Nombre de véhicules</Label>
            <Input
              type="number"
              min={0}
              value={formData.vehicle_count}
              onChange={(e) => updateField("vehicle_count", parseInt(e.target.value) || 0)}
              className="h-9"
            />
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Checkbox
              id="property"
              checked={formData.property_owner}
              onCheckedChange={(c) => updateField("property_owner", !!c)}
            />
            <Label htmlFor="property" className="text-xs cursor-pointer">Propriétaire immobilier</Label>
          </div>
          {formData.property_owner && (
            <div className="space-y-1">
              <Label className="text-xs">Type de bien</Label>
              <Select value={formData.property_type || ""} onValueChange={(v) => updateField("property_type", v || null)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Assurances existantes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Shield className="h-4 w-4" />
          Assurances existantes
        </div>
        <div className="flex flex-wrap gap-3">
          {insuranceTypeOptions.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`ins-${opt.value}`}
                checked={(formData.existing_insurances || []).includes(opt.value)}
                onCheckedChange={() => toggleInsurance(opt.value)}
              />
              <Label htmlFor={`ins-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</Label>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Assureur actuel</Label>
          <Input
            value={formData.current_insurer || ""}
            onChange={(e) => updateField("current_insurer", e.target.value || null)}
            placeholder="Nom de l'assureur"
            className="h-9"
          />
        </div>
      </div>

      {/* Préférences de contact */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Phone className="h-4 w-4" />
          Préférences de contact
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Méthode préférée</Label>
            <Select value={formData.preferred_contact_method} onValueChange={(v) => updateField("preferred_contact_method", v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contactMethodOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Horaire préféré</Label>
            <Select value={formData.preferred_contact_time || ""} onValueChange={(v) => updateField("preferred_contact_time", v || null)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {contactTimeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Source d'acquisition */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Calendar className="h-4 w-4" />
          Acquisition
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Comment nous a-t-il connu ?</Label>
            <Select value={formData.referral_source || ""} onValueChange={(v) => updateField("referral_source", v || null)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {referralSourceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <Checkbox
              id="loyalty"
              checked={formData.loyalty_program_interest}
              onCheckedChange={(c) => updateField("loyalty_program_interest", !!c)}
            />
            <Label htmlFor="loyalty" className="text-xs cursor-pointer">Intéressé programme fidélité</Label>
          </div>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      {hasChanges && (
        <div className="sticky bottom-0 bg-background pt-3 border-t">
          <Button
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      )}
    </div>
  );
}
