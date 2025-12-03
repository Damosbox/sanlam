import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const leadFormSchema = z.object({
  first_name: z.string().trim().min(1, "Prénom requis").max(50),
  last_name: z.string().trim().min(1, "Nom requis").max(50),
  email: z.string().trim().email("Email invalide").max(100).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  product_interest: z.string().optional(),
  source: z.string().optional(),
});

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateLeadDialog = ({ open, onOpenChange }: CreateLeadDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    product_interest: "",
    source: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
        assigned_broker_id: userData.user.id,
        status: "nouveau",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-leads"] });
      onOpenChange(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        whatsapp: "",
        product_interest: "",
        source: "",
      });
      setFormErrors({});
      toast({ title: "Lead créé" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer le lead", variant: "destructive" });
    },
  });

  const handleCreateLead = () => {
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
    createLeadMutation.mutate(formData);
  };

  const updateFormField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nouveau Lead
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

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateLead} disabled={createLeadMutation.isPending}>
              {createLeadMutation.isPending ? "Création..." : "Créer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
