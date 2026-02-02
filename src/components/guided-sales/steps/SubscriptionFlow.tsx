import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronRight, 
  ChevronLeft,
  User,
  MapPin,
  Car,
  CreditCard,
  FileText,
  Upload,
  Calendar
} from "lucide-react";
import { GuidedSalesState, CityType, LicenseCategory, PriorCertificateType } from "../types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface SubscriptionFlowProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["subscription"]>) => void;
  onNext: () => void;
}

const cityOptions: { value: CityType; label: string }[] = [
  { value: "abidjan", label: "Abidjan" },
  { value: "bouake", label: "Bouaké" },
  { value: "yamoussoukro", label: "Yamoussoukro" },
  { value: "korhogo", label: "Korhogo" },
  { value: "daloa", label: "Daloa" },
  { value: "san_pedro", label: "San Pedro" },
  { value: "man", label: "Man" },
  { value: "gagnoa", label: "Gagnoa" },
];

const licenseCategories: LicenseCategory[] = ["A", "B", "C", "D", "E", "AB", "ABCD", "ABCDE"];

const SUB_STEPS = [
  { id: 1, title: "Agent" },
  { id: 2, title: "Localisation" },
  { id: 3, title: "Véhicule" },
  { id: 4, title: "Conducteur" },
  { id: 5, title: "Documents" },
  { id: 6, title: "Paiement" },
];

export const SubscriptionFlow = ({ state, onUpdate, onNext }: SubscriptionFlowProps) => {
  const [subStep, setSubStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [declarationText, setDeclarationText] = useState("");
  const { subscription } = state;

  const licenseDate = subscription.licenseIssueDate ? new Date(subscription.licenseIssueDate) : undefined;

  // Sub-step validations
  const isSubStep1Valid = () => !!subscription.agentCode;
  const isSubStep2Valid = () => !!subscription.geographicAddress && !!subscription.city;
  const isSubStep3Valid = () => 
    !!subscription.vehicleBrand && 
    !!subscription.vehicleModel && 
    !!subscription.vehicleRegistrationNumber && 
    !!subscription.vehicleChassisNumber;
  const isSubStep4Valid = () => 
    !!subscription.licenseCategory && 
    !!subscription.licenseNumber && 
    !!subscription.licenseIssueDate;
  const isSubStep5Valid = () => !!subscription.priorCertificateType;
  const isSubStep6Valid = () => true; // Payment handled in next step

  const goNext = () => {
    if (subStep < 6) {
      setSubStep((subStep + 1) as 1 | 2 | 3 | 4 | 5 | 6);
    } else {
      onNext();
    }
  };

  const goBack = () => {
    if (subStep > 1) {
      setSubStep((subStep - 1) as 1 | 2 | 3 | 4 | 5 | 6);
    }
  };

  const handleFileUpload = (field: string) => {
    const fileName = "document.pdf";
    onUpdate({ [field]: fileName });
    toast.success("Document téléchargé avec succès");
  };

  const handleDeclarationSave = () => {
    onUpdate({ 
      priorCertificateType: "declaration",
      declarationText 
    });
    setShowDeclarationModal(false);
    toast.success("Déclaration sur l'honneur enregistrée");
  };

  // Progress dots
  const renderProgress = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {SUB_STEPS.map((s) => (
        <button
          key={s.id}
          onClick={() => s.id <= subStep && setSubStep(s.id as 1 | 2 | 3 | 4 | 5 | 6)}
          disabled={s.id > subStep}
          className={cn(
            "w-3 h-3 rounded-full transition-all",
            s.id === subStep 
              ? "bg-primary scale-110" 
              : s.id < subStep 
                ? "bg-primary/50 cursor-pointer hover:bg-primary/70" 
                : "bg-muted"
          )}
          title={s.title}
        />
      ))}
    </div>
  );

  // Sub-step 1: Agent
  const renderSubStep1 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agent</h1>
        <p className="text-muted-foreground mt-1">Étape 1/6 - Identification de l'agent</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Code de l'agent</h3>
          </div>
          <Input
            value={subscription.agentCode}
            disabled
            className="max-w-xs bg-muted"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Code agent pré-rempli depuis votre profil
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={goNext} disabled={!isSubStep1Valid()} className="gap-2">
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Sub-step 2: Localisation
  const renderSubStep2 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Localisation</h1>
        <p className="text-muted-foreground mt-1">Étape 2/6 - Adresse géographique</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Adresse</h3>
          </div>
          
          <div>
            <Label className="text-sm font-medium">1. Adresse géographique *</Label>
            <Input
              placeholder="Rue, quartier, commune..."
              value={subscription.geographicAddress}
              onChange={(e) => onUpdate({ geographicAddress: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">2. Ville *</Label>
            <Select
              value={subscription.city}
              onValueChange={(v) => onUpdate({ city: v as CityType })}
            >
              <SelectTrigger className="mt-1 max-w-xs">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {cityOptions.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button onClick={goNext} disabled={!isSubStep2Valid()} className="gap-2">
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Sub-step 3: Véhicule
  const renderSubStep3 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Véhicule</h1>
        <p className="text-muted-foreground mt-1">Étape 3/6 - Identification du véhicule</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Car className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Détails du véhicule</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">1. Marque *</Label>
              <Input
                placeholder="Ex: Toyota"
                value={subscription.vehicleBrand}
                onChange={(e) => onUpdate({ vehicleBrand: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">2. Modèle *</Label>
              <Input
                placeholder="Ex: Corolla"
                value={subscription.vehicleModel}
                onChange={(e) => onUpdate({ vehicleModel: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">3. N° d'immatriculation *</Label>
              <Input
                placeholder="Ex: AB 1234 CD"
                value={subscription.vehicleRegistrationNumber}
                onChange={(e) => onUpdate({ vehicleRegistrationNumber: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">4. N° de châssis *</Label>
              <Input
                placeholder="Ex: WVWZZZ3CZWE123456"
                value={subscription.vehicleChassisNumber}
                onChange={(e) => onUpdate({ vehicleChassisNumber: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button onClick={goNext} disabled={!isSubStep3Valid()} className="gap-2">
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Sub-step 4: Conducteur
  const renderSubStep4 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Conducteur</h1>
        <p className="text-muted-foreground mt-1">Étape 4/6 - Informations du conducteur</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Permis de conduire</h3>
          </div>
          
          <div>
            <Label className="text-sm font-medium">1. Conducteur habituel ?</Label>
            <RadioGroup
              value={subscription.isHabitualDriver ? "oui" : "non"}
              onValueChange={(v) => onUpdate({ isHabitualDriver: v === "oui" })}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="oui" id="habitual-oui" />
                <Label htmlFor="habitual-oui">Oui</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="non" id="habitual-non" />
                <Label htmlFor="habitual-non">Non</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">2. Catégorie du permis *</Label>
              <Select
                value={subscription.licenseCategory}
                onValueChange={(v) => onUpdate({ licenseCategory: v as LicenseCategory })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {licenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      Catégorie {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">3. Numéro de permis *</Label>
              <Input
                placeholder="Ex: 123456789"
                value={subscription.licenseNumber}
                onChange={(e) => onUpdate({ licenseNumber: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">4. Date d'obtention *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full max-w-xs justify-start text-left font-normal mt-1",
                    !licenseDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {licenseDate ? format(licenseDate, "dd/MM/yyyy", { locale: fr }) : "JJ/MM/AAAA"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={licenseDate}
                  onSelect={(date) => date && onUpdate({ licenseIssueDate: date.toISOString() })}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button onClick={goNext} disabled={!isSubStep4Valid()} className="gap-2">
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Sub-step 5: Documents
  const renderSubStep5 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
        <p className="text-muted-foreground mt-1">Étape 5/6 - Justificatifs</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Documents requis</h3>
          </div>
          
          <div>
            <Label className="text-sm font-medium">1. Lieu d'obtention du permis</Label>
            <Select
              value={subscription.licenseIssuePlace || ""}
              onValueChange={(v) => onUpdate({ licenseIssuePlace: v })}
            >
              <SelectTrigger className="mt-1 max-w-xs">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {cityOptions.map((city) => (
                  <SelectItem key={city.value} value={city.label}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">2. Carte grise</Label>
            <div className="mt-1">
              {subscription.vehicleRegistrationDocument ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg max-w-xs">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm">{subscription.vehicleRegistrationDocument}</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleFileUpload("vehicleRegistrationDocument")}
                >
                  <Upload className="h-4 w-4" />
                  Télécharger
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">3. Certificat d'antériorité *</Label>
            <Select
              value={subscription.priorCertificateType || ""}
              onValueChange={(v) => {
                onUpdate({ priorCertificateType: v as PriorCertificateType });
                if (v === "declaration") {
                  setShowDeclarationModal(true);
                }
              }}
            >
              <SelectTrigger className="mt-1 max-w-xs">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="documents">Documents justificatifs</SelectItem>
                <SelectItem value="declaration">Déclaration sur l'honneur</SelectItem>
              </SelectContent>
            </Select>
            {subscription.priorCertificateType === "declaration" && subscription.declarationText && (
              <p className="text-xs text-muted-foreground mt-2">
                ✓ Déclaration enregistrée
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Declaration Modal */}
      <Dialog open={showDeclarationModal} onOpenChange={setShowDeclarationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déclaration sur l'honneur</DialogTitle>
            <DialogDescription>
              Veuillez saisir votre déclaration concernant l'antériorité d'assurance
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Je soussigné(e) déclare sur l'honneur que..."
            value={declarationText}
            onChange={(e) => setDeclarationText(e.target.value)}
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclarationModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleDeclarationSave} disabled={!declarationText.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button onClick={goNext} disabled={!isSubStep5Valid()} className="gap-2">
          Continuer vers Paiement
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Sub-step 6: This step just confirms and moves to MobilePaymentStep
  const renderSubStep6 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Confirmation</h1>
        <p className="text-muted-foreground mt-1">Étape 6/6 - Vérification finale</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Informations complètes</h3>
            <p className="text-muted-foreground">
              Toutes les informations de souscription ont été saisies. 
              Passez à l'étape de paiement pour finaliser.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button onClick={onNext} className="gap-2">
          Continuer vers Paiement
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      {renderProgress()}
      {subStep === 1 && renderSubStep1()}
      {subStep === 2 && renderSubStep2()}
      {subStep === 3 && renderSubStep3()}
      {subStep === 4 && renderSubStep4()}
      {subStep === 5 && renderSubStep5()}
      {subStep === 6 && renderSubStep6()}
    </div>
  );
};
