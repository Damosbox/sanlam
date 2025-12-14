import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Pencil } from "lucide-react";
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

export const CreateLeadDialog = ({ open, onOpenChange, lead, mode = "create" }: CreateLeadDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(emptyFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    } else if (!open) {
      setFormData(emptyFormData);
      setFormErrors({});
    }
  }, [isEditMode, lead, open]);

  const createLeadMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      const { error } = await supabase.from("leads").insert({
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        whatsapp: data.whatsapp?.trim() || null,
        product_interest: data.product_interest || null,
        source: data.source || null,
        notes: data.notes?.trim() || null,
        assigned_broker_id: userData.user.id,
        status: "nouveau",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-leads"] });
      onOpenChange(false);
      setFormData(emptyFormData);
      setFormErrors({});
      toast({ title: "Lead créé" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le lead", variant: "destructive" });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!lead) throw new Error("Lead non trouvé");

      const { error } = await supabase.from("leads").update({
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        whatsapp: data.whatsapp?.trim() || null,
        product_interest: data.product_interest || null,
        source: data.source || null,
        notes: data.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      }).eq("id", lead.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-leads"] });
      onOpenChange(false);
      toast({ title: "Lead modifié" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de modifier le lead", variant: "destructive" });
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
      updateLeadMutation.mutate(formData);
    } else {
      createLeadMutation.mutate(formData);
    }
  };

  const updateFormField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const isPending = createLeadMutation.isPending || updateLeadMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Pencil className="h-5 w-5" />
                Modifier le Lead
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Nouveau Lead
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
                placeholder="+225 07 00 00 00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => updateFormField("whatsapp", e.target.value)}
                placeholder="+225 07 00 00 00"
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
            <Label htmlFor="notes">Données complémentaires</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateFormField("notes", e.target.value)}
              placeholder="Informations supplémentaires sur le prospect..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {isEditMode && (
              <Button 
                variant="default" 
                onClick={handleSubmit} 
                disabled={isPending}
                className="bg-primary"
              >
                {isPending ? "Modification..." : "Modifier"}
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            {!isEditMode && (
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Création..." : "Créer"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
