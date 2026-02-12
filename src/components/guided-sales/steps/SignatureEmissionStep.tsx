import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  PenTool, 
  Check, 
  Shield, 
  Download, 
  Printer, 
  Mail,
  ChevronLeft
} from "lucide-react";
import { GuidedSalesState } from "../types";
import { formatFCFA } from "@/utils/formatCurrency";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SignatureEmissionStepProps {
  state: GuidedSalesState;
  onUpdateBinding: (data: Partial<GuidedSalesState["binding"]>) => void;
  onEdit: (section: "vehicle" | "driver" | "payment") => void;
  onEmit: () => void;
}

export const SignatureEmissionStep = ({ 
  state, 
  onUpdateBinding, 
  onEdit,
  onEmit 
}: SignatureEmissionStepProps) => {
  const { calculatedPremium, binding, needsAnalysis, subscription, coverage, productSelection, packObsequesData } = state;
  const isObseques = productSelection.selectedProduct === "pack_obseques";
  const [isEmitting, setIsEmitting] = useState(false);
  const [isEmitted, setIsEmitted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSign = () => {
    // Mock signature
    onUpdateBinding({ signatureCompleted: true, signatureData: "signature-data-mock" });
    toast.success("Signature enregistrée");
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    onUpdateBinding({ signatureCompleted: false, signatureData: undefined });
  };

  const handleEmit = async () => {
    setIsEmitting(true);
    // Simulate emission
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsEmitting(false);
    setIsEmitted(true);
    onEmit();
    toast.success("Police émise avec succès !");
  };

  const canEmit = binding.acceptTerms && binding.acceptDataSharing && binding.signatureCompleted;

  const policyPrefix = isObseques ? "OBSEQ" : "AUTO";
  const documents = isObseques
    ? ["Certificat d'adhésion", "Conditions particulières", "Tableau des garanties"]
    : ["Attestation d'assurance", "Conditions particulières", "Carte verte"];

  if (isEmitted) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-6">
            <Check className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Police émise avec succès !</h1>
          <p className="text-muted-foreground mb-6">
            Le contrat a été créé et les documents sont prêts
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            N° Police: {policyPrefix}-2025-{Math.floor(Math.random() * 100000)}
          </Badge>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Documents générés</h3>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-medium">{doc}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Nouvelle souscription
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Signature et Émission</h1>
        <p className="text-muted-foreground mt-1">
          Validez le contrat et émettez la police
        </p>
      </div>

      {/* Résumé financier */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Résumé financier
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prime nette</span>
              <span className="font-medium">{formatFCFA(calculatedPremium.primeNette)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frais accessoires</span>
              <span className="font-medium">{formatFCFA(calculatedPremium.fraisAccessoires)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxes (14,5%)</span>
              <span className="font-medium">{formatFCFA(calculatedPremium.taxes)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <span className="font-semibold">Montant total à payer</span>
              <span className="font-bold text-primary text-lg">
                {formatFCFA(calculatedPremium.totalAPayer)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections éditables */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Récapitulatif du contrat</h3>
          
          <div className="space-y-4">
            {isObseques ? (
              <>
                {/* Section Souscripteur */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Souscripteur</p>
                    <p className="text-sm text-muted-foreground">
                      {packObsequesData?.firstName} {packObsequesData?.lastName}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onEdit("vehicle")}>
                    Éditer
                  </Button>
                </div>

                {/* Section Formule */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Formule</p>
                    <p className="text-sm text-muted-foreground uppercase">
                      {packObsequesData?.formula || "BRONZE"}
                    </p>
                  </div>
                </div>

                {/* Section Adhésion */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Adhésion</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {packObsequesData?.adhesionType?.replace("_", " + ") || "Individuelle"} — {packObsequesData?.periodicity || "Mensuelle"}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Section Véhicule */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Véhicule</p>
                    <p className="text-sm text-muted-foreground">
                      {needsAnalysis.vehicleBrand} {needsAnalysis.vehicleModel} - {needsAnalysis.vehicleFiscalPower} CV
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onEdit("vehicle")}>
                    Éditer
                  </Button>
                </div>

                {/* Section Conducteur */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Conducteur</p>
                    <p className="text-sm text-muted-foreground">
                      {subscription.driverName || "Non renseigné"} - Permis {subscription.licenseCategory}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onEdit("driver")}>
                    Éditer
                  </Button>
                </div>

                {/* Section Formule */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Formule</p>
                    <p className="text-sm text-muted-foreground">
                      {coverage.planTier === "basic" ? "MINI" : coverage.planTier === "standard" ? "BASIC" : "TOUT RISQUE"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation légale */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Validation légale</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="accept-terms"
                checked={binding.acceptTerms}
                onCheckedChange={(checked) => onUpdateBinding({ acceptTerms: checked as boolean })}
              />
              <Label htmlFor="accept-terms" className="text-sm leading-relaxed">
                J'accepte les conditions générales d'assurance et je confirme avoir pris connaissance 
                des exclusions et limitations de garantie.
              </Label>
            </div>
            
            <div className="flex items-start gap-3">
              <Checkbox
                id="accept-sharing"
                checked={binding.acceptDataSharing}
                onCheckedChange={(checked) => onUpdateBinding({ acceptDataSharing: checked as boolean })}
              />
              <Label htmlFor="accept-sharing" className="text-sm leading-relaxed">
                J'autorise le partage de mes informations avec les partenaires de SanlamAllianz 
                dans le cadre de la gestion de mon contrat.
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <PenTool className="h-5 w-5 text-primary" />
            Signature digitale
            {binding.signatureCompleted && (
              <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700">
                <Check className="h-3 w-3 mr-1" />
                Signé
              </Badge>
            )}
          </h3>
          
          <div className="space-y-3">
            <div 
              className={cn(
                "border-2 border-dashed rounded-lg h-32 flex items-center justify-center",
                binding.signatureCompleted ? "border-emerald-500 bg-emerald-50" : "border-muted-foreground/30"
              )}
            >
              {binding.signatureCompleted ? (
                <div className="text-center text-emerald-600">
                  <Check className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Signature enregistrée</p>
                </div>
              ) : (
                <canvas 
                  ref={canvasRef}
                  className="w-full h-full cursor-crosshair"
                  onClick={handleSign}
                />
              )}
            </div>
            
            <div className="flex gap-2">
              {!binding.signatureCompleted ? (
                <Button onClick={handleSign} className="gap-2">
                  <PenTool className="h-4 w-4" />
                  Signer
                </Button>
              ) : (
                <Button variant="outline" onClick={clearSignature}>
                  Effacer et resigner
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton final */}
      <div className="flex justify-center pt-4">
        <Button 
          size="lg"
          onClick={handleEmit}
          disabled={!canEmit || isEmitting}
          className="px-8 gap-2"
        >
          {isEmitting ? (
            <>
              <span className="animate-spin">⏳</span>
              Émission en cours...
            </>
          ) : (
            <>
              <FileText className="h-5 w-5" />
              Émettre la police
            </>
          )}
        </Button>
      </div>

      {!canEmit && (
        <p className="text-sm text-center text-muted-foreground">
          Veuillez accepter les conditions et signer le contrat pour émettre la police
        </p>
      )}
    </div>
  );
};
