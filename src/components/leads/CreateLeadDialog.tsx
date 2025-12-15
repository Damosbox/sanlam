import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, Pencil, ChevronDown, User, Briefcase, Car, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

const leadFormSchema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis").max(50),
  last_name: z.string().trim().min(1, "Nom requis").max(50),
  email: z.string().trim().email("Email invalide").max(100).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  product_interest: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Tables<"leads"> | null;
  mode?: "create" | "edit";
}

const emptyFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  whatsapp: "",
  product_interest: "",
  source: "",
  notes: "",
};

const emptyAdditionalData = {
  birth_date: "",
  gender: "",
  marital_status: "",
  children_count: 0,
  socio_professional_category: "",
  profession: "",
  monthly_income_range: "",
  has_drivers_license: false,
  drivers_license_date: "",
  vehicle_count: 0,
  city: "",
  address: "",
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
  { value: "moins_100k", label: "< 100 000 FCFA" },
  { value: "100k_300k", label: "100k - 300k FCFA" },
  { value: "300k_500k", label: "300k - 500k FCFA" },
  { value: "500k_1m", label: "500k - 1M FCFA" },
  { value: "1m_3m", label: "1M - 3M FCFA" },
  { value: "plus_3m", label: "> 3M FCFA" },
];

export const CreateLeadDialog = ({ open, onOpenChange, lead, mode = "create" }: CreateLeadDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(emptyFormData);
  const [additionalData, setAdditionalData] = useState(emptyAdditionalData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showAdditional, setShowAdditional] = useState(false);

  const isEditMode = mode === "edit" && lead;

  useEffect(() => {
    if (isEditMode && lead) {
      setFormData({
        first_name: lead.first_name || "",
        last_name: lead.last_name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        whatsapp: lead.whatsapp || "",
        product_interest: lead.product_interest || "",
        source: lead.source || "",
        notes: lead.notes || "",
      });
      // Fetch additional data
      fetchAdditionalData(lead.id);
    } else if (!open) {
      setFormData(emptyFormData);
      setAdditionalData(emptyAdditionalData);
      setFormErrors({});
      setShowAdditional(false);
    }
  }, [isEditMode, lead, open]);

  const fetchAdditionalData = async (leadId: string) => {
    const { data } = await supabase
      .from("lead_additional_data")
      .select("*")
      .eq("lead_id", leadId)
      .maybeSingle();
    
    if (data) {
      setAdditionalData({
        birth_date: data.birth_date || "",
        gender: data.gender || "",
        marital_status: data.marital_status || "",
        children_count: data.children_count || 0,
        socio_professional_category: data.socio_professional_category || "",
        profession: data.profession || "",
        monthly_income_range: data.monthly_income_range || "",
        has_drivers_license: data.has_drivers_license || false,
        drivers_license_date: data.drivers_license_date || "",
        vehicle_count: data.vehicle_count || 0,
        city: data.city || "",
        address: data.address || "",
      });
      setShowAdditional(true);
    }
  };

  const createLeadMutation = useMutation({
    mutationFn: async (data: { form: typeof formData; additional: typeof additionalData }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      // Create lead
      const { data: newLead, error } = await supabase.from("leads").insert({
        first_name: data.form.first_name.trim(),
        last_name: data.form.last_name.trim(),
        email: data.form.email?.trim() || null,
        phone: data.form.phone?.trim() || null,
        whatsapp: data.form.whatsapp?.trim() || null,
        product_interest: data.form.product_interest || null,
        source: data.form.source || null,
        notes: data.form.notes?.trim() || null,
        assigned_broker_id: userData.user.id,
        status: "nouveau",
      }).select().single();

      if (error) throw error;

      // Create additional data if any field is filled
      const hasAdditionalData = Object.entries(data.additional).some(([key, value]) => {
        if (key === "children_count" || key === "vehicle_count") return (value as number) > 0;
        if (key === "has_drivers_license") return value === true;
        return value !== "" && value !== null;
      });

      if (hasAdditionalData && newLead) {
        const { error: additionalError } = await supabase.from("lead_additional_data").insert({
          lead_id: newLead.id,
          birth_date: data.additional.birth_date || null,
          gender: data.additional.gender || null,
          marital_status: data.additional.marital_status || null,
          children_count: data.additional.children_count || 0,
          socio_professional_category: data.additional.socio_professional_category || null,
          profession: data.additional.profession || null,
          monthly_income_range: data.additional.monthly_income_range || null,
          has_drivers_license: data.additional.has_drivers_license,
          drivers_license_date: data.additional.drivers_license_date || null,
          vehicle_count: data.additional.vehicle_count || 0,
          city: data.additional.city || null,
          address: data.additional.address || null,
        });
        if (additionalError) console.error("Additional data error:", additionalError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-leads"] });
      onOpenChange(false);
      setFormData(emptyFormData);
      setAdditionalData(emptyAdditionalData);
      setFormErrors({});
      toast({ title: "Prospect créé" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le prospect", variant: "destructive" });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (data: { form: typeof formData; additional: typeof additionalData }) => {
      if (!lead) throw new Error("Lead non trouvé");

      // Update lead
      const { error } = await supabase.from("leads").update({
        first_name: data.form.first_name.trim(),
        last_name: data.form.last_name.trim(),
        email: data.form.email?.trim() || null,
        phone: data.form.phone?.trim() || null,
        whatsapp: data.form.whatsapp?.trim() || null,
        product_interest: data.form.product_interest || null,
        source: data.form.source || null,
        notes: data.form.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      }).eq("id", lead.id);

      if (error) throw error;

      // Upsert additional data
      const { data: existing } = await supabase
        .from("lead_additional_data")
        .select("id")
        .eq("lead_id", lead.id)
        .maybeSingle();

      const additionalPayload = {
        lead_id: lead.id,
        birth_date: data.additional.birth_date || null,
        gender: data.additional.gender || null,
        marital_status: data.additional.marital_status || null,
        children_count: data.additional.children_count || 0,
        socio_professional_category: data.additional.socio_professional_category || null,
        profession: data.additional.profession || null,
        monthly_income_range: data.additional.monthly_income_range || null,
        has_drivers_license: data.additional.has_drivers_license,
        drivers_license_date: data.additional.drivers_license_date || null,
        vehicle_count: data.additional.vehicle_count || 0,
        city: data.additional.city || null,
        address: data.additional.address || null,
      };

      if (existing) {
        await supabase.from("lead_additional_data").update(additionalPayload).eq("lead_id", lead.id);
      } else {
        await supabase.from("lead_additional_data").insert(additionalPayload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-additional-data", lead?.id] });
      onOpenChange(false);
      toast({ title: "Prospect modifié" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le prospect", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    const result = leadFormSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    
    if (isEditMode) {
      updateLeadMutation.mutate({ form: formData, additional: additionalData });
    } else {
      createLeadMutation.mutate({ form: formData, additional: additionalData });
    }
  };

  const updateFormField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const updateAdditionalField = <K extends keyof typeof additionalData>(field: K, value: typeof additionalData[K]) => {
    setAdditionalData((prev) => ({ ...prev, [field]: value }));
  };

  const isPending = createLeadMutation.isPending || updateLeadMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Pencil className="h-5 w-5" />
                Modifier le Prospect
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Nouveau Prospect
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-5">
            {/* Informations de base */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => updateFormField("first_name", e.target.value)}
                  placeholder="Jean"
                  className={formErrors.first_name ? "border-destructive" : ""}
                />
                {formErrors.first_name && (
                  <p className="text-xs text-destructive">{formErrors.first_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => updateFormField("last_name", e.target.value)}
                  placeholder="Dupont"
                  className={formErrors.last_name ? "border-destructive" : ""}
                />
                {formErrors.last_name && (
                  <p className="text-xs text-destructive">{formErrors.last_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormField("email", e.target.value)}
                placeholder="jean.dupont@exemple.com"
                className={formErrors.email ? "border-destructive" : ""}
              />
              {formErrors.email && (
                <p className="text-xs text-destructive">{formErrors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormField("phone", e.target.value)}
                  placeholder="+221 77 000 00 00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => updateFormField("whatsapp", e.target.value)}
                  placeholder="+221 77 000 00 00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Produit d'intérêt</Label>
                <Select
                  value={formData.product_interest}
                  onValueChange={(value) => updateFormField("product_interest", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Auto">Auto</SelectItem>
                    <SelectItem value="Habitation">Habitation</SelectItem>
                    <SelectItem value="Santé">Santé</SelectItem>
                    <SelectItem value="Épargne">Épargne</SelectItem>
                    <SelectItem value="Éducation">Éducation</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => updateFormField("source", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Site web">Site web</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Appel entrant">Appel entrant</SelectItem>
                    <SelectItem value="Recommandation">Recommandation</SelectItem>
                    <SelectItem value="Salon/Événement">Salon/Événement</SelectItem>
                    <SelectItem value="Réseaux sociaux">Réseaux sociaux</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormField("notes", e.target.value)}
                placeholder="Informations supplémentaires..."
                rows={2}
              />
            </div>

            {/* Données complémentaires (Collapsible) */}
            <Collapsible open={showAdditional} onOpenChange={setShowAdditional}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-3 py-2 h-auto border border-dashed">
                  <span className="text-sm font-medium">Données complémentaires</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdditional ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-5">
                {/* Informations personnelles */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="h-4 w-4" />
                    Informations personnelles
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Date de naissance</Label>
                      <Input
                        type="date"
                        value={additionalData.birth_date}
                        onChange={(e) => updateAdditionalField("birth_date", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Genre</Label>
                      <Select value={additionalData.gender} onValueChange={(v) => updateAdditionalField("gender", v)}>
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
                      <Select value={additionalData.marital_status} onValueChange={(v) => updateAdditionalField("marital_status", v)}>
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
                        value={additionalData.children_count}
                        onChange={(e) => updateAdditionalField("children_count", parseInt(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Informations professionnelles */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    Situation socio-professionnelle
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Catégorie</Label>
                      <Select value={additionalData.socio_professional_category} onValueChange={(v) => updateAdditionalField("socio_professional_category", v)}>
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
                        value={additionalData.profession}
                        onChange={(e) => updateAdditionalField("profession", e.target.value)}
                        placeholder="Ex: Comptable"
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Revenu mensuel</Label>
                      <Select value={additionalData.monthly_income_range} onValueChange={(v) => updateAdditionalField("monthly_income_range", v)}>
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

                {/* Véhicules */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Car className="h-4 w-4" />
                    Véhicules
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 col-span-2">
                      <Checkbox
                        id="license"
                        checked={additionalData.has_drivers_license}
                        onCheckedChange={(c) => updateAdditionalField("has_drivers_license", !!c)}
                      />
                      <Label htmlFor="license" className="text-xs cursor-pointer">Permis de conduire</Label>
                    </div>
                    {additionalData.has_drivers_license && (
                      <div className="space-y-1">
                        <Label className="text-xs">Date d'obtention</Label>
                        <Input
                          type="date"
                          value={additionalData.drivers_license_date}
                          onChange={(e) => updateAdditionalField("drivers_license_date", e.target.value)}
                          className="h-9"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Nombre de véhicules</Label>
                      <Input
                        type="number"
                        min={0}
                        value={additionalData.vehicle_count}
                        onChange={(e) => updateAdditionalField("vehicle_count", parseInt(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Localisation */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Localisation
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Ville</Label>
                      <Input
                        value={additionalData.city}
                        onChange={(e) => updateAdditionalField("city", e.target.value)}
                        placeholder="Dakar"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Adresse</Label>
                      <Input
                        value={additionalData.address}
                        onChange={(e) => updateAdditionalField("address", e.target.value)}
                        placeholder="Quartier, rue..."
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 p-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (isEditMode ? "Modification..." : "Création...") : (isEditMode ? "Modifier" : "Créer")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
