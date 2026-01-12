import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ChurnReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  productType: string;
}

const churnReasonsByProduct: Record<string, { value: string; label: string }[]> = {
  auto: [
    { value: "prix_concurrent", label: "Prix concurrent moins cher" },
    { value: "vehicule_vendu", label: "Véhicule vendu" },
    { value: "service_insatisfaisant", label: "Service insatisfaisant" },
    { value: "sinistre_mal_gere", label: "Sinistre mal géré" },
    { value: "changement_situation", label: "Changement de situation" },
    { value: "autre", label: "Autre raison" },
  ],
  mrh: [
    { value: "prix_concurrent", label: "Prix concurrent moins cher" },
    { value: "demenagement", label: "Déménagement" },
    { value: "service_insatisfaisant", label: "Service insatisfaisant" },
    { value: "sinistre_mal_gere", label: "Sinistre mal géré" },
    { value: "changement_situation", label: "Changement de situation" },
    { value: "autre", label: "Autre raison" },
  ],
  sante: [
    { value: "prix_concurrent", label: "Prix concurrent moins cher" },
    { value: "couverture_insuffisante", label: "Couverture insuffisante" },
    { value: "delais_remboursement", label: "Délais de remboursement" },
    { value: "reseau_soins_limite", label: "Réseau de soins limité" },
    { value: "changement_employeur", label: "Changement d'employeur" },
    { value: "autre", label: "Autre raison" },
  ],
  vie: [
    { value: "prix_concurrent", label: "Prix concurrent moins cher" },
    { value: "rendement_insuffisant", label: "Rendement insuffisant" },
    { value: "besoin_liquidite", label: "Besoin de liquidité" },
    { value: "changement_situation", label: "Changement de situation familiale" },
    { value: "autre", label: "Autre raison" },
  ],
  obseques: [
    { value: "prix_concurrent", label: "Prix concurrent moins cher" },
    { value: "garanties_insuffisantes", label: "Garanties insuffisantes" },
    { value: "changement_situation", label: "Changement de situation" },
    { value: "autre", label: "Autre raison" },
  ],
  default: [
    { value: "prix_concurrent", label: "Prix concurrent moins cher" },
    { value: "service_insatisfaisant", label: "Service insatisfaisant" },
    { value: "changement_situation", label: "Changement de situation" },
    { value: "autre", label: "Autre raison" },
  ],
};

export function ChurnReasonDialog({ 
  open, 
  onOpenChange, 
  subscriptionId,
  productType 
}: ChurnReasonDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reasons = churnReasonsByProduct[productType.toLowerCase()] || churnReasonsByProduct.default;

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          renewal_status: "lost",
          client_decision: "churn",
          churn_reason: selectedReason,
          last_contacted_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-renewals"] });
      toast({
        title: "Client perdu enregistré",
        description: "La raison de churn a été sauvegardée",
      });
      onOpenChange(false);
      setSelectedReason("");
      setNotes("");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la raison",
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    if (!selectedReason) {
      toast({
        title: "Sélectionnez une raison",
        description: "Veuillez indiquer la raison de la perte du client",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Raison de la perte</DialogTitle>
          <DialogDescription>
            Pourquoi ce client n'a-t-il pas renouvelé son contrat ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {reasons.map((reason) => (
              <div key={reason.value} className="flex items-center space-x-2">
                <RadioGroupItem value={reason.value} id={reason.value} />
                <Label htmlFor={reason.value} className="cursor-pointer">
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes additionnelles (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Détails supplémentaires..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={mutation.isPending}
            variant="destructive"
          >
            {mutation.isPending ? "Enregistrement..." : "Confirmer la perte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
