import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  FileText, 
  PenTool, 
  Check, 
  Shield, 
  Download, 
  Printer, 
  Mail,
  Car,
  Calendar,
  User,
  MapPin,
  HelpCircle,
  Pencil,
  ClipboardList,
} from "lucide-react";
import { GuidedSalesState, PlanTier, ContractPeriodicity } from "../types";
import { formatFCFA } from "@/utils/formatCurrency";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SignatureEmissionStepProps {
  state: GuidedSalesState;
  onUpdateBinding: (data: Partial<GuidedSalesState["binding"]>) => void;
  onEdit: (section: "vehicle" | "driver" | "payment") => void;
  onNext: () => void;
  onEditStep: (step: number) => void;
}

// --- Shared helpers ---

const planNames: Record<PlanTier, string> = {
  mini: "MINI",
  basic: "BASIC",
  medium: "MEDIUM",
  medium_plus: "MEDIUM+",
  evolution: "EVOLUTION",
  evolution_plus: "EVOLUTION+",
  supreme: "SUPRÊME",
};

const periodicityLabels: Record<ContractPeriodicity, string> = {
  "1_month": "1 mois",
  "3_months": "3 mois",
  "6_months": "6 mois",
  "1_year": "12 mois",
};

const energyLabels: Record<string, string> = {
  essence: "Essence",
  gasoil: "Gasoil",
  hybride: "Hybride",
  electrique: "Électrique",
};

const tooltips = {
  primeNette: "Prime de base calculée selon la puissance fiscale, l'usage du véhicule, le nombre de places et les garanties sélectionnées.",
  fraisAccessoires: "Frais fixes de gestion et d'émission du contrat d'assurance.",
  taxes: "Taxes fiscales obligatoires représentant 14% de la prime nette, conformément à la réglementation CIMA.",
  primeTTC: "Prime Toutes Taxes Comprises = Prime Nette + Frais d'accessoires + Taxes.",
  fga: "Fond de Garantie Automobile : contribution obligatoire (2% de la prime nette, min. 5 000 FCFA).",
  cedeao: "Carte Brune CEDEAO : couverture responsabilité civile dans les 15 pays de la CEDEAO.",
  totalAPayer: "Montant total incluant la prime TTC et toutes les contributions obligatoires.",
};

const guaranteesByPlan: Record<PlanTier, string[]> = {
  mini: ["RC", "Recours Tiers Incendie", "Défense Recours", "IC/IPT"],
  basic: ["RC", "Recours Tiers Incendie", "Défense Recours", "IC/IPT", "Avance sur recours"],
  medium: ["RC", "Défense Recours", "IC/IPT", "Avance sur recours", "Incendie", "Vol accessoires", "Bris de glaces"],
  medium_plus: ["RC", "Défense Recours", "IC/IPT", "Avance sur recours", "Incendie", "Vol", "Vol à main armée", "Vol accessoires", "Bris de glaces"],
  evolution: ["RC", "Défense Recours", "IC/IPT", "Avance sur recours", "Incendie", "Vol", "Vol accessoires", "Bris de glaces", "Tierce complète plafonnée"],
  evolution_plus: ["RC", "Défense Recours", "IC/IPT", "Avance sur recours", "Incendie", "Vol", "Vol accessoires", "Bris de glaces", "Tierce collision plafonnée"],
  supreme: ["RC", "Défense Recours", "IC/IPT", "Avance sur recours (gratuit)", "Incendie", "Vol", "Vol accessoires", "Bris de glaces (gratuit)", "Tierce complète non plafonnée"],
};

const cityLabels: Record<string, string> = {
  abidjan: "Abidjan",
  bouake: "Bouaké",
  yamoussoukro: "Yamoussoukro",
  korhogo: "Korhogo",
  daloa: "Daloa",
  san_pedro: "San Pedro",
  man: "Man",
  gagnoa: "Gagnoa",
};

// --- Sub-components ---

interface PremiumLineProps {
  label: string;
  value: string;
  tooltip: string;
  isBold?: boolean;
}

const PremiumLine = ({ label, value, tooltip, isBold }: PremiumLineProps) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-1.5">
      <span className={isBold ? "font-semibold text-foreground" : "text-muted-foreground"}>{label}</span>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[280px] text-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
    <span className={isBold ? "font-semibold" : ""}>{value}</span>
  </div>
);

const SectionHeader = ({ icon: Icon, title, onEdit }: { icon: React.ElementType; title: string; onEdit?: () => void }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="font-semibold text-lg">{title}</h3>
    </div>
    {onEdit && (
      <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1.5 text-muted-foreground hover:text-primary">
        <Pencil className="h-3.5 w-3.5" />
        Modifier
      </Button>
    )}
  </div>
);

const InfoItem = ({ label, value }: { label: string; value?: string | number | null }) => {
  if (!value) return null;
  return (
    <div>
      <span className="text-muted-foreground text-sm">{label}</span>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
};

// --- Main component ---

export const SignatureEmissionStep = ({ 
  state, 
  onUpdateBinding, 
  onEdit,
  onNext,
  onEditStep,
}: SignatureEmissionStepProps) => {
  const { calculatedPremium, binding, needsAnalysis, subscription, coverage, productSelection, packObsequesData, clientIdentification } = state;
  const isObseques = productSelection.selectedProduct === "pack_obseques";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check screening_blocked status
  const contactId = clientIdentification.linkedContactId;
  const contactType = clientIdentification.linkedContactType;
  
  const { data: screeningBlocked } = useQuery({
    queryKey: ["screening-blocked", contactId, contactType],
    queryFn: async () => {
      if (!contactId) return false;
      if (contactType === "prospect") {
        const { data } = await supabase
          .from("lead_kyc_compliance")
          .select("screening_blocked")
          .eq("lead_id", contactId)
          .maybeSingle();
        return data?.screening_blocked || false;
      } else {
        const { data } = await supabase
          .from("client_kyc_compliance")
          .select("screening_blocked")
          .eq("client_id", contactId)
          .maybeSingle();
        return data?.screening_blocked || false;
      }
    },
    enabled: !!contactId,
  });

  const handleSign = () => {
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

  const canProceed = binding.acceptTerms && binding.acceptDataSharing && binding.signatureCompleted && !screeningBlocked;

  const policyPrefix = isObseques ? "OBSEQ" : "AUTO";
  const documents = isObseques
    ? ["Certificat d'adhésion", "Conditions particulières", "Tableau des garanties"]
    : ["Attestation d'assurance", "Conditions particulières", "Carte verte"];

  const effectiveDate = needsAnalysis.effectiveDate ? new Date(needsAnalysis.effectiveDate) : null;
  const selectedPeriodicity = needsAnalysis.contractPeriodicity || "1_year";

  // --- Main view: Global Recap + Validation + Signature ---
  return (
    <div className="space-y-6">
      {/* Screening blocked alert */}
      {screeningBlocked && (
        <Alert variant="destructive">
          <AlertDescription className="font-medium">
            SanlamAllianz reviendra vers le client afin de compléter la transaction ou mettre à jour des informations sur sa fiche.
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h1 className="text-2xl font-bold text-foreground">Récapitulatif global & Signature</h1>
        <p className="text-muted-foreground mt-1">
          Vérifiez l'ensemble du contrat avant émission
        </p>
      </div>

      {/* ===== SECTION 1: Véhicule (cotation) ===== */}
      {!isObseques && (
        <Card>
          <CardContent className="pt-6">
            <SectionHeader icon={Car} title="Véhicule" onEdit={() => onEditStep(1)} />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoItem label="Marque" value={needsAnalysis.vehicleBrand} />
              <InfoItem label="Modèle" value={needsAnalysis.vehicleModel} />
              <InfoItem label="Puissance fiscale" value={needsAnalysis.vehicleFiscalPower ? `${needsAnalysis.vehicleFiscalPower} CV` : undefined} />
              <InfoItem label="Énergie" value={needsAnalysis.vehicleEnergy ? energyLabels[needsAnalysis.vehicleEnergy] || needsAnalysis.vehicleEnergy : undefined} />
              <InfoItem label="Valeur vénale" value={needsAnalysis.vehicleVenalValue ? formatFCFA(needsAnalysis.vehicleVenalValue) : undefined} />
              <InfoItem label="Valeur à neuf" value={needsAnalysis.vehicleNewValue ? formatFCFA(needsAnalysis.vehicleNewValue) : undefined} />
              <InfoItem label="Places" value={needsAnalysis.vehicleSeats} />
              <InfoItem label="1ère mise en circulation" value={needsAnalysis.vehicleFirstCirculationDate ? format(new Date(needsAnalysis.vehicleFirstCirculationDate), "dd/MM/yyyy") : undefined} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== Obsèques: Souscripteur ===== */}
      {isObseques && (
        <Card>
          <CardContent className="pt-6">
            <SectionHeader icon={User} title="Souscripteur" onEdit={() => onEditStep(1)} />
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoItem label="Nom" value={packObsequesData?.lastName} />
              <InfoItem label="Prénom" value={packObsequesData?.firstName} />
              <InfoItem label="Formule" value={(packObsequesData?.formula || "BRONZE").toUpperCase()} />
              <InfoItem label="Adhésion" value={packObsequesData?.adhesionType?.replace("_", " + ")} />
              <InfoItem label="Périodicité" value={packObsequesData?.periodicity} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== SECTION 2: Formule & Garanties (cotation) ===== */}
      {!isObseques && (
        <Card>
          <CardContent className="pt-6">
            <SectionHeader icon={Shield} title="Formule & Garanties" onEdit={() => onEditStep(2)} />
            <div className="flex items-center gap-3 mb-4">
              <Badge className="text-base px-4 py-1.5">{planNames[coverage.planTier]}</Badge>
              {coverage.assistanceLevel && (
                <Badge variant="secondary">{coverage.assistanceLevel}</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm font-medium mb-2">Garanties incluses :</p>
            <div className="grid grid-cols-2 gap-2">
              {guaranteesByPlan[coverage.planTier].map((g) => (
                <div key={g} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-sm">{g}</span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoItem label="Durée du contrat" value={periodicityLabels[selectedPeriodicity]} />
              <InfoItem label="Date d'effet" value={effectiveDate ? format(effectiveDate, "PPP", { locale: fr }) : "Non définie"} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== SECTION 3: Souscription (données collectées étape 4) ===== */}
      {!isObseques && (
        <Card>
          <CardContent className="pt-6">
            <SectionHeader icon={ClipboardList} title="Données de souscription" onEdit={() => onEditStep(4)} />
            <div className="space-y-4">
              {/* Agent */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Agent</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <InfoItem label="Code agent" value={subscription.agentCode} />
                </div>
              </div>

              <Separator />

              {/* Localisation */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Localisation</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <InfoItem label="Adresse" value={subscription.geographicAddress || "Non renseignée"} />
                  <InfoItem label="Ville" value={cityLabels[subscription.city] || subscription.city} />
                </div>
              </div>

              <Separator />

              {/* Véhicule immatriculé */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Véhicule immatriculé</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <InfoItem label="Marque" value={subscription.vehicleBrand} />
                  <InfoItem label="Modèle" value={subscription.vehicleModel} />
                  <InfoItem label="N° Immatriculation" value={subscription.vehicleRegistrationNumber} />
                  <InfoItem label="N° Châssis" value={subscription.vehicleChassisNumber} />
                </div>
              </div>

              <Separator />

              {/* Conducteur */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Conducteur</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <InfoItem label="Nom" value={subscription.driverName || "Non renseigné"} />
                  <InfoItem label="Catégorie permis" value={subscription.licenseCategory} />
                  <InfoItem label="N° Permis" value={subscription.licenseNumber} />
                  <InfoItem label="Date délivrance" value={subscription.licenseIssueDate} />
                  <InfoItem label="Lieu délivrance" value={subscription.licenseIssuePlace} />
                </div>
              </div>

              <Separator />

              {/* Documents */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Documents & Antécédents</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <InfoItem label="Type antécédent" value={subscription.priorCertificateType === "documents" ? "Documents fournis" : "Déclaration"} />
                  {subscription.priorInsurer && <InfoItem label="Assureur précédent" value={subscription.priorInsurer} />}
                  {subscription.bonusPercentage !== undefined && <InfoItem label="Bonus" value={`${subscription.bonusPercentage}%`} />}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== SECTION 4: Décompte de prime ===== */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-4">Décompte de prime</h3>
          
          <div className="space-y-2 text-sm">
            <PremiumLine label="Prime Nette" value={formatFCFA(calculatedPremium.primeNette)} tooltip={tooltips.primeNette} />
            <PremiumLine label="Frais d'accessoires" value={formatFCFA(calculatedPremium.fraisAccessoires)} tooltip={tooltips.fraisAccessoires} />
            <PremiumLine label="Taxes (14,5%)" value={formatFCFA(calculatedPremium.taxes)} tooltip={tooltips.taxes} />
          </div>

          <Separator className="my-3" />

          <div className="space-y-2 text-sm">
            <PremiumLine label="Prime TTC" value={formatFCFADecimal(calculatedPremium.primeTTC)} tooltip={tooltips.primeTTC} isBold />
            <PremiumLine label="FGA" value={formatFCFADecimal(calculatedPremium.fga)} tooltip={tooltips.fga} />
            <PremiumLine label="Carte Brune CEDEAO" value={formatFCFADecimal(calculatedPremium.cedeao)} tooltip={tooltips.cedeao} />
          </div>

          <Separator className="my-3" />

          <div className="flex items-center justify-between bg-primary/10 rounded-lg p-4">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground">Total à payer</span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px] text-xs">
                    <p>{tooltips.totalAPayer}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-2xl font-bold text-primary">{formatFCFA(calculatedPremium.totalAPayer)}</span>
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 5: Validation légale ===== */}
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

      {/* ===== SECTION 6: Signature digitale ===== */}
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

      {/* ===== SECTION 7: Bouton Continuer vers Paiement ===== */}
      <div className="flex justify-center pt-4">
        <Button 
          size="lg"
          onClick={onNext}
          disabled={!canProceed}
          className="px-8 gap-2"
        >
          <FileText className="h-5 w-5" />
          Continuer vers Paiement
        </Button>
      </div>

      {!canProceed && (
        <p className="text-sm text-center text-muted-foreground">
          Veuillez accepter les conditions et signer le contrat pour continuer
        </p>
      )}
    </div>
  );
};
