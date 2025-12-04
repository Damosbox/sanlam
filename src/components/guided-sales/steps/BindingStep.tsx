import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, MessageSquare, Smartphone, PenTool, FileText, CheckCircle } from "lucide-react";
import { GuidedSalesState } from "../types";
import { cn } from "@/lib/utils";

interface BindingStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["binding"]>) => void;
}

const signatureChannels = [
  { id: "email", label: "Email", icon: Mail, description: "Envoi du contrat par email" },
  { id: "sms", label: "SMS", icon: MessageSquare, description: "Lien de signature par SMS" },
  { id: "whatsapp", label: "WhatsApp", icon: Smartphone, description: "Partage via WhatsApp" },
  { id: "presential", label: "Signature Présentielle", icon: PenTool, description: "Signature sur tablette agent" },
];

export const BindingStep = ({ state, onUpdate }: BindingStepProps) => {
  const { binding } = state;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Signature & Engagement</h1>
        <p className="text-muted-foreground mt-1">
          Finalisez le contrat avec la signature électronique.
        </p>
      </div>

      {/* Recap Card */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Récapitulatif du contrat</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Produit</span>
              <span className="font-medium">Assurance Auto - Standard</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Couvertures</span>
              <span className="font-medium">RC + Défense + Vol & Incendie</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Options</span>
              <span className="font-medium">Bris de glace, Assistance 0km</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <span className="font-medium">Prime totale</span>
              <span className="font-bold text-primary">{state.calculatedPremium.total} €/an</span>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Documents */}
          <h4 className="font-medium mb-3">Documents générés</h4>
          <div className="space-y-2">
            {["Devis détaillé", "IPID (Fiche d'information)", "Conditions générales"].map((doc) => (
              <div key={doc} className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-primary hover:underline cursor-pointer">{doc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Signature Channel Selection */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Canal de signature</h3>
          
          <RadioGroup
            value={binding.signatureChannel}
            onValueChange={(v) => onUpdate({ signatureChannel: v as any })}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
          >
            {signatureChannels.map((channel) => (
              <div key={channel.id}>
                <RadioGroupItem value={channel.id} id={channel.id} className="peer sr-only" />
                <Label
                  htmlFor={channel.id}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                    "hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    binding.signatureChannel === channel.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    <channel.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{channel.label}</p>
                    <p className="text-xs text-muted-foreground">{channel.description}</p>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="mt-6">
            <Button className="w-full" size="lg">
              Envoyer pour signature
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
