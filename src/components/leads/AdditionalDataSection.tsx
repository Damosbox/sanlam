import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, User, Briefcase, MapPin, Car, Shield, Phone, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  genderOptions,
  maritalStatusOptions,
  socioProOptions,
  incomeOptions,
  propertyTypeOptions,
  insuranceTypeOptions,
  contactMethodOptions,
  contactTimeOptions,
  referralSourceOptions,
} from "@/constants/additionalDataOptions";

interface AdditionalDataSectionProps {
  leadId: string;
}

interface FormData {
  birth_date: string;
  gender: string;
  marital_status: string;
  children_count: number;
  socio_professional_category: string;
  profession: string;
  employer: string;
  monthly_income_range: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  has_drivers_license: boolean;
  drivers_license_date: string;
  vehicle_count: number;
  property_owner: boolean;
  property_type: string;
  existing_insurances: string[];
  current_insurer: string;
  preferred_contact_method: string;
  preferred_contact_time: string;
  referral_source: string;
  loyalty_program_interest: boolean;
}

export function AdditionalDataSection({ leadId }: AdditionalDataSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { register, handleSubmit, setValue, watch, reset, formState: { isDirty } } = useForm<FormData>({
    defaultValues: {
      birth_date: "",
      gender: "",
      marital_status: "",
      children_count: 0,
      socio_professional_category: "",
      profession: "",
      employer: "",
      monthly_income_range: "",
      address: "",
      city: "",
      postal_code: "",
      country: "Sénégal",
      has_drivers_license: false,
      drivers_license_date: "",
      vehicle_count: 0,
      property_owner: false,
      property_type: "",
      existing_insurances: [],
      current_insurer: "",
      preferred_contact_method: "phone",
      preferred_contact_time: "",
      referral_source: "",
      loyalty_program_interest: false,
    },
  });

  useEffect(() => {
    if (existingData) {
      reset({
        birth_date: existingData.birth_date || "",
        gender: existingData.gender || "",
        marital_status: existingData.marital_status || "",
        children_count: existingData.children_count || 0,
        socio_professional_category: existingData.socio_professional_category || "",
        profession: existingData.profession || "",
        employer: existingData.employer || "",
        monthly_income_range: existingData.monthly_income_range || "",
        address: existingData.address || "",
        city: existingData.city || "",
        postal_code: existingData.postal_code || "",
        country: existingData.country || "Sénégal",
        has_drivers_license: existingData.has_drivers_license || false,
        drivers_license_date: existingData.drivers_license_date || "",
        vehicle_count: existingData.vehicle_count || 0,
        property_owner: existingData.property_owner || false,
        property_type: existingData.property_type || "",
        existing_insurances: existingData.existing_insurances || [],
        current_insurer: existingData.current_insurer || "",
        preferred_contact_method: existingData.preferred_contact_method || "phone",
        preferred_contact_time: existingData.preferred_contact_time || "",
        referral_source: existingData.referral_source || "",
        loyalty_program_interest: existingData.loyalty_program_interest || false,
      });
    }
  }, [existingData, reset]);

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const payload = {
        lead_id: leadId,
        ...formData,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        marital_status: formData.marital_status || null,
        socio_professional_category: formData.socio_professional_category || null,
        profession: formData.profession || null,
        employer: formData.employer || null,
        monthly_income_range: formData.monthly_income_range || null,
        address: formData.address || null,
        city: formData.city || null,
        postal_code: formData.postal_code || null,
        drivers_license_date: formData.drivers_license_date || null,
        property_type: formData.property_type || null,
        current_insurer: formData.current_insurer || null,
        preferred_contact_time: formData.preferred_contact_time || null,
        referral_source: formData.referral_source || null,
      };

      if (existingData) {
        const { error } = await supabase
          .from("lead_additional_data")
          .update(payload)
          .eq("lead_id", leadId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lead_additional_data")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-additional-data", leadId] });
      toast({ title: "Données complémentaires enregistrées" });
    },
    onError: () => {
      toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
    },
  });

  const toggleInsurance = (insurance: string) => {
    const current = watch("existing_insurances") || [];
    const updated = current.includes(insurance)
      ? current.filter((i) => i !== insurance)
      : [...current, insurance];
    setValue("existing_insurances", updated, { shouldDirty: true });
  };

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Informations personnelles */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Date de naissance</Label>
            <Input type="date" className="h-8 text-sm" {...register("birth_date")} />
          </div>
          <div>
            <Label className="text-xs">Genre</Label>
            <Select value={watch("gender")} onValueChange={(v) => setValue("gender", v, { shouldDirty: true })}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Situation familiale</Label>
            <Select value={watch("marital_status")} onValueChange={(v) => setValue("marital_status", v, { shouldDirty: true })}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {maritalStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Nombre d'enfants</Label>
            <Input type="number" min={0} className="h-8" {...register("children_count", { valueAsNumber: true })} />
          </div>
        </CardContent>
      </Card>

      {/* Informations professionnelles */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Situation socio-professionnelle
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Catégorie</Label>
            <Select value={watch("socio_professional_category")} onValueChange={(v) => setValue("socio_professional_category", v, { shouldDirty: true })}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {socioProOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Profession</Label>
            <Input className="h-8 text-sm" {...register("profession")} />
          </div>
          <div>
            <Label className="text-xs">Employeur</Label>
            <Input className="h-8 text-sm" {...register("employer")} />
          </div>
          <div>
            <Label className="text-xs">Revenu mensuel</Label>
            <Select value={watch("monthly_income_range")} onValueChange={(v) => setValue("monthly_income_range", v, { shouldDirty: true })}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {incomeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Localisation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Adresse & Logement
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Adresse</Label>
            <Input className="h-8 text-sm" {...register("address")} />
          </div>
          <div>
            <Label className="text-xs">Ville</Label>
            <Input className="h-8 text-sm" {...register("city")} />
          </div>
          <div>
            <Label className="text-xs">Code postal</Label>
            <Input className="h-8 text-sm" {...register("postal_code")} />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={watch("property_owner")}
              onCheckedChange={(v) => setValue("property_owner", v, { shouldDirty: true })}
            />
            <Label className="text-xs">Propriétaire</Label>
          </div>
          <div>
            <Label className="text-xs">Type de logement</Label>
            <Select value={watch("property_type")} onValueChange={(v) => setValue("property_type", v, { shouldDirty: true })}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {propertyTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Véhicules */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Car className="h-4 w-4" />
            Véhicules
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Nombre de véhicules</Label>
            <Input type="number" min={0} className="h-8" {...register("vehicle_count", { valueAsNumber: true })} />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <Switch
              checked={watch("has_drivers_license")}
              onCheckedChange={(v) => setValue("has_drivers_license", v, { shouldDirty: true })}
            />
            <Label className="text-xs">Permis de conduire</Label>
          </div>
          {watch("has_drivers_license") && (
            <div className="col-span-2">
              <Label className="text-xs">Date d'obtention du permis</Label>
              <Input type="date" className="h-8" {...register("drivers_license_date")} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assurances existantes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Assurances existantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {insuranceTypeOptions.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={`ins-${opt.value}`}
                  checked={(watch("existing_insurances") || []).includes(opt.value)}
                  onCheckedChange={() => toggleInsurance(opt.value)}
                />
                <Label htmlFor={`ins-${opt.value}`} className="text-xs cursor-pointer">{opt.label}</Label>
              </div>
            ))}
          </div>
          <div>
            <Label className="text-xs">Assureur actuel</Label>
            <Input className="h-8 text-sm" {...register("current_insurer")} />
          </div>
        </CardContent>
      </Card>

      {/* Préférences de contact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Préférences de contact
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Méthode préférée</Label>
            <Select value={watch("preferred_contact_method")} onValueChange={(v) => setValue("preferred_contact_method", v, { shouldDirty: true })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contactMethodOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Horaire préféré</Label>
            <Select value={watch("preferred_contact_time")} onValueChange={(v) => setValue("preferred_contact_time", v, { shouldDirty: true })}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {contactTimeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Acquisition */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Acquisition
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Comment nous a-t-il connu ?</Label>
            <Select value={watch("referral_source")} onValueChange={(v) => setValue("referral_source", v, { shouldDirty: true })}>
              <SelectTrigger className="h-8">
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
              checked={watch("loyalty_program_interest")}
              onCheckedChange={(c) => setValue("loyalty_program_interest", !!c, { shouldDirty: true })}
            />
            <Label htmlFor="loyalty" className="text-xs cursor-pointer">Intéressé programme fidélité</Label>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      {isDirty && (
        <div className="sticky bottom-0 bg-background pt-3 border-t">
          <Button type="submit" disabled={saveMutation.isPending} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      )}
    </form>
  );
}
