import { useState, useRef, useMemo } from "react";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  ChevronRight, 
  ChevronLeft,
  User,
  MapPin,
  Car,
  CreditCard,
  FileText,
  Upload,
  Calendar,
  Loader2,
  CheckCircle2,
  Search,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CameraUploadButton } from "@/components/ui/CameraUploadButton";
import { GuidedSalesState, CityType, LicenseCategory, PriorCertificateType } from "../types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VEHICLES, getUniqueBrands } from "@/data/vehicles";

interface SubscriptionFlowProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["subscription"]>) => void;
  onNext: () => void;
  initialSubStep?: number;
  onSubStepChange?: (subStep: number) => void;
}

const cityOptions: { value: CityType; label: string; quartiers: string[] }[] = [
  { value: "abidjan", label: "Abidjan", quartiers: ["Cocody", "Plateau", "Marcory", "Treichville", "Adjamé", "Abobo", "Yopougon", "Koumassi", "Port-Bouët", "Attécoubé", "Bingerville", "Songon", "Anyama", "Riviera", "Angré", "Deux Plateaux", "Williamsville", "Faya", "Niangon", "Banco", "Vridi", "Zone 4", "Blockhauss"] },
  { value: "bouake", label: "Bouaké", quartiers: ["Commerce", "Koko", "Dar-es-Salam", "Air France", "Belleville", "N'Gattakro", "Ahougnansou", "Sokoura", "Kennedy", "Nimbo"] },
  { value: "yamoussoukro", label: "Yamoussoukro", quartiers: ["Habitat", "Kokrenou", "Morofé", "Dioulakro", "N'Zuéssy", "Millionnaire", "Assabou", "Sopim"] },
  { value: "korhogo", label: "Korhogo", quartiers: ["Banaforo", "Cocody", "Kassirimé", "Koko", "Petit Paris", "Sinistré", "Teguéré"] },
  { value: "daloa", label: "Daloa", quartiers: ["Commerce", "Lobia", "Tazibouo", "Huberson", "Orly", "Soleil", "Marais", "Kennedy"] },
  { value: "san_pedro", label: "San Pedro", quartiers: ["Bardot", "Cité", "Lac", "Séwéké", "Bardo", "Zimbabwe"] },
  { value: "man", label: "Man", quartiers: ["Commerce", "Domoraud", "Grand Gbapleu", "Libreville", "Kôblen", "Lycée"] },
  { value: "gagnoa", label: "Gagnoa", quartiers: ["Dioulabougou", "Commerce", "Plateau", "Garahio", "Bettié", "Sicogie"] },
];

const licenseCategories: LicenseCategory[] = ["A", "B", "C", "D", "E", "AB", "ABCD", "ABCDE"];

// Reordered: Documents (3) before Véhicule (4)
const SUB_STEPS = [
  { id: 1, title: "Agent" },
  { id: 2, title: "Localisation" },
  { id: 3, title: "Documents" },
  { id: 4, title: "Véhicule" },
  { id: 5, title: "Conducteur" },
];

const periodicityLabels: Record<string, string> = {
  "1_month": "1 mois",
  "3_months": "3 mois",
  "6_months": "6 mois",
  "1_year": "1 an",
};

const employmentOptions: { value: string; label: string }[] = [
  { value: "fonctionnaire", label: "Fonctionnaire" },
  { value: "salarie", label: "Salarié" },
  { value: "exploitant_agricole", label: "Exploitant agricole" },
  { value: "artisan", label: "Artisan" },
  { value: "religieux", label: "Religieux" },
  { value: "retraite", label: "Retraité" },
  { value: "sans_profession", label: "Sans profession" },
  { value: "agent_commercial", label: "Agent commercial" },
  { value: "autres", label: "Autres" },
];

export const SubscriptionFlow = ({ state, onUpdate, onNext, initialSubStep, onSubStepChange }: SubscriptionFlowProps) => {
  const [subStepLocal, setSubStepLocal] = useState<1 | 2 | 3 | 4 | 5>((initialSubStep ?? 1) as 1 | 2 | 3 | 4 | 5);
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [declarationText, setDeclarationText] = useState("");
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [isIdentityOCRProcessing, setIsIdentityOCRProcessing] = useState(false);
  const [identityOCRDone, setIdentityOCRDone] = useState(false);
  const [screeningStatus, setScreeningStatus] = useState<"idle" | "processing" | "ok" | "blocked">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addressSearch, setAddressSearch] = useState("");
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);

  // Vehicle brand/model suggestions
  const brands = useMemo(() => getUniqueBrands(), []);
  const filteredBrands = useMemo(() => {
    if (!brandSearch) return brands.slice(0, 15);
    return brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())).slice(0, 15);
  }, [brandSearch, brands]);
  
  const filteredModels = useMemo(() => {
    if (!state.subscription.vehicleBrand) return [];
    const models = VEHICLES.filter(v => v.brand === state.subscription.vehicleBrand);
    if (!modelSearch) return models.slice(0, 20);
    return models.filter(v => v.model.toLowerCase().includes(modelSearch.toLowerCase())).slice(0, 20);
  }, [state.subscription.vehicleBrand, modelSearch]);

  // Address suggestions based on selected city
  const addressSuggestions = useMemo(() => {
    const selectedCity = cityOptions.find(c => c.value === state.subscription.city);
    if (!selectedCity) return [];
    const quartiers = selectedCity.quartiers;
    if (!addressSearch) return quartiers.slice(0, 10);
    return quartiers.filter(q => q.toLowerCase().includes(addressSearch.toLowerCase())).slice(0, 10);
  }, [state.subscription.city, addressSearch]);

  const setSubStep = (val: 1 | 2 | 3 | 4 | 5) => {
    setSubStepLocal(val);
    onSubStepChange?.(val);
  };

  const subStep = subStepLocal;
  const { subscription } = state;

  const licenseDate = subscription.licenseIssueDate ? new Date(subscription.licenseIssueDate) : undefined;

  // Sub-step validations
  const isSubStep1Valid = () => !!subscription.agentCode;
  const isSubStep2Valid = () => !!subscription.geographicAddress && !!subscription.city;
  const isSubStep3Valid = () => !!subscription.priorCertificateType;
  const isSubStep4Valid = () => 
    !!subscription.vehicleBrand && 
    !!subscription.vehicleModel && 
    !!subscription.vehicleRegistrationNumber && 
    !!subscription.vehicleChassisNumber;
  const isSubStep5Valid = () => 
    !!subscription.licenseCategory && 
    !!subscription.licenseNumber && 
    !!subscription.licenseIssueDate &&
    !!(subscription.ownerLastName || state.clientIdentification?.lastName) &&
    !!(subscription.ownerFirstName || state.clientIdentification?.firstName);

  const goNext = () => {
    if (subStep < 5) {
      setSubStep((subStep + 1) as 1 | 2 | 3 | 4 | 5);
    } else {
      onNext();
    }
  };

  const goBack = () => {
    if (subStep > 1) {
      setSubStep((subStep - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleFileUpload = (field: string) => {
    const fileName = "document.pdf";
    onUpdate({ [field]: fileName });
    toast.success("Document téléchargé avec succès");
  };

  const handleCarteGriseUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOCRProcessing(true);
    setOcrSuccess(false);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("ocr-vehicle-registration", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;

      if (data?.extracted) {
        const ext = data.extracted;
        const updates: Partial<GuidedSalesState["subscription"]> = {
          vehicleRegistrationDocument: file.name,
        };

        const filledFields: string[] = [];
        if (ext.vehicleBrand) { updates.vehicleBrand = ext.vehicleBrand; filledFields.push("Marque"); }
        if (ext.vehicleModel) { updates.vehicleModel = ext.vehicleModel; filledFields.push("Modèle"); }
        if (ext.registrationNumber) { updates.vehicleRegistrationNumber = ext.registrationNumber; filledFields.push("Immatriculation"); }
        if (ext.chassisNumber) { updates.vehicleChassisNumber = ext.chassisNumber; filledFields.push("Châssis"); }

        onUpdate(updates);
        setOcrSuccess(true);

        if (filledFields.length > 0) {
          toast.success(`Carte grise analysée ! Champs pré-remplis : ${filledFields.join(", ")}`, {
            duration: 5000,
          });
        } else {
          toast.warning("L'analyse n'a pas pu extraire de données. Vérifiez la qualité de l'image.");
        }
      } else {
        onUpdate({ vehicleRegistrationDocument: file.name });
        toast.warning("Impossible d'extraire les données. Le document a été enregistré.");
      }
    } catch (err) {
      console.error("OCR error:", err);
      toast.error("Erreur lors de l'analyse de la carte grise");
      onUpdate({ vehicleRegistrationDocument: file.name });
    } finally {
      setIsOCRProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const handleIdentityOCRUpload = async (file: File) => {
    setIsIdentityOCRProcessing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("ocr-identity", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;

      if (data?.extracted) {
        const ext = data.extracted;
        const updates: Partial<GuidedSalesState["subscription"]> = {};
        const filledFields: string[] = [];

        if (ext.lastName) { updates.ownerLastName = ext.lastName; filledFields.push("Nom"); }
        if (ext.firstName) { updates.ownerFirstName = ext.firstName; filledFields.push("Prénom"); }
        onUpdate(updates);
        setIdentityOCRDone(true);

        if (filledFields.length > 0) {
          toast.success(`Pièce analysée ! Champs pré-remplis : ${filledFields.join(", ")}`, { duration: 5000 });
        }

        // Chain LCB-FT screening
        if (ext.firstName && ext.lastName) {
          setScreeningStatus("processing");
          try {
            const { data: screening, error: screenErr } = await supabase.functions.invoke("screen-ppe", {
              body: {
                clientId: "guided-sales-temp",
                entityType: "lead",
                firstName: ext.firstName,
                lastName: ext.lastName,
              },
            });
            if (screenErr) throw screenErr;
            setScreeningStatus(screening?.result?.screeningBlocked ? "blocked" : "ok");
          } catch (screenError) {
            console.error("Screening error:", screenError);
            setScreeningStatus("ok");
          }
        }
      } else {
        toast.warning("Impossible d'extraire les données du document.");
      }
    } catch (err) {
      console.error("OCR Identity error:", err);
      toast.error("Erreur lors de l'analyse de la pièce d'identité");
    } finally {
      setIsIdentityOCRProcessing(false);
    }
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
          onClick={() => s.id <= subStep && setSubStep(s.id as 1 | 2 | 3 | 4 | 5)}
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
        <p className="text-muted-foreground mt-1">Étape 1/5 - Identification de l'agent</p>
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
        <p className="text-muted-foreground mt-1">Étape 2/5 - Adresse géographique</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Adresse</h3>
          </div>
          
          <div>
            <Label className="text-sm font-medium">1. Ville *</Label>
            <Select
              value={subscription.city}
              onValueChange={(v) => {
                onUpdate({ city: v as CityType });
                setAddressSearch("");
              }}
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

          <div className="relative">
            <Label className="text-sm font-medium">2. Adresse géographique *</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={subscription.city ? "Tapez un quartier ou une adresse..." : "Sélectionnez d'abord une ville"}
                value={subscription.geographicAddress}
                onChange={(e) => {
                  onUpdate({ geographicAddress: e.target.value });
                  setAddressSearch(e.target.value);
                  setShowAddressSuggestions(true);
                }}
                onFocus={() => setShowAddressSuggestions(true)}
                onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                className="pl-9"
                disabled={!subscription.city}
              />
            </div>
            {showAddressSuggestions && subscription.city && addressSuggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                {addressSuggestions.map((quartier) => (
                  <button
                    key={quartier}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const selectedCity = cityOptions.find(c => c.value === subscription.city);
                      onUpdate({ geographicAddress: `${quartier}, ${selectedCity?.label || ""}` });
                      setShowAddressSuggestions(false);
                    }}
                  >
                    <span className="font-medium">{quartier}</span>
                    <span className="text-muted-foreground ml-1">— {cityOptions.find(c => c.value === subscription.city)?.label}</span>
                  </button>
                ))}
              </div>
            )}
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

  // Sub-step 3: Documents (moved before Véhicule for OCR pre-fill)
  const renderSubStep3 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
        <p className="text-muted-foreground mt-1">Étape 3/5 - Justificatifs</p>
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

          {/* Carte grise with OCR */}
          <div>
            <Label className="text-sm font-medium">2. Carte grise (OCR automatique)</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Uploadez une photo de la carte grise pour pré-remplir automatiquement les informations du véhicule
            </p>
            <div className="mt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCarteGriseUpload}
                disabled={isOCRProcessing}
              />
              {subscription.vehicleRegistrationDocument ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg max-w-md">
                    {ocrSuccess ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <span className="text-sm truncate">{subscription.vehicleRegistrationDocument}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isOCRProcessing}
                  >
                    <Upload className="h-4 w-4" />
                    Remplacer
                  </Button>
                </div>
              ) : isOCRProcessing ? (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg max-w-md">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="text-sm font-medium">Analyse en cours...</p>
                    <p className="text-xs text-muted-foreground">Extraction des données du véhicule</p>
                  </div>
                </div>
              ) : (
                <CameraUploadButton
                  id="carte-grise-ocr"
                  onFileSelected={(file) => {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    const fakeEvent = { target: { files: dt.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleCarteGriseUpload(fakeEvent);
                  }}
                  disabled={isOCRProcessing}
                  uploadLabel="Uploader"
                  cameraLabel="Scanner"
                />
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
        <Button onClick={goNext} disabled={!isSubStep3Valid()} className="gap-2">
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Sub-step 4: Véhicule (now after Documents, may be pre-filled by OCR)
  const renderSubStep4 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Véhicule</h1>
        <p className="text-muted-foreground mt-1">Étape 4/5 - Identification du véhicule</p>
        {ocrSuccess && (
          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Champs pré-remplis par l'analyse de la carte grise
          </p>
        )}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Car className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Détails du véhicule</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Label className="text-sm font-medium">1. Marque *</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une marque..."
                  value={subscription.vehicleBrand || brandSearch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBrandSearch(val);
                    onUpdate({ vehicleBrand: val, vehicleModel: "" });
                    setShowBrandSuggestions(true);
                    setModelSearch("");
                  }}
                  onFocus={() => setShowBrandSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
                  className="pl-9"
                />
              </div>
              {showBrandSuggestions && filteredBrands.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                  {filteredBrands.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors",
                        subscription.vehicleBrand === brand && "bg-accent font-medium"
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onUpdate({ vehicleBrand: brand, vehicleModel: "" });
                        setBrandSearch("");
                        setShowBrandSuggestions(false);
                      }}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <Label className="text-sm font-medium">2. Modèle *</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={subscription.vehicleBrand ? "Rechercher un modèle..." : "Sélectionnez d'abord une marque"}
                  value={subscription.vehicleModel || modelSearch}
                  onChange={(e) => {
                    setModelSearch(e.target.value);
                    onUpdate({ vehicleModel: e.target.value });
                    setShowModelSuggestions(true);
                  }}
                  onFocus={() => setShowModelSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowModelSuggestions(false), 200)}
                  className="pl-9"
                  disabled={!subscription.vehicleBrand}
                />
              </div>
              {showModelSuggestions && filteredModels.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                  {filteredModels.map((v) => (
                    <button
                      key={`${v.brand}-${v.model}`}
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors",
                        subscription.vehicleModel === v.model && "bg-accent font-medium"
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onUpdate({ vehicleModel: v.model });
                        setModelSearch("");
                        setShowModelSuggestions(false);
                      }}
                    >
                      <span>{v.model}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({v.startYear} - {v.endYear || "aujourd'hui"})
                      </span>
                    </button>
                  ))}
                </div>
              )}
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
        <Button onClick={goNext} disabled={!isSubStep4Valid()} className="gap-2">
          Suivant
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const ownerLastName = subscription.ownerLastName || state.clientIdentification?.lastName || "";
  const ownerFirstName = subscription.ownerFirstName || state.clientIdentification?.firstName || "";
  const ownerPhone = subscription.ownerPhone || state.clientIdentification?.phone || "";
  const ownerEmployment = subscription.ownerEmploymentType || state.needsAnalysis?.employmentType || "";
  const ownerEffectiveDate = state.needsAnalysis?.effectiveDate || "";
  const ownerPeriodicity = state.needsAnalysis?.contractPeriodicity || "";

  // Sub-step 5: Conducteur
  const renderSubStep5 = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Conducteur</h1>
        <p className="text-muted-foreground mt-1">Étape 5/5 - Informations du conducteur</p>
      </div>

      {/* Information du propriétaire */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Information du propriétaire</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Nom du propriétaire *</Label>
              <Input
                value={ownerLastName}
                onChange={(e) => onUpdate({ ownerLastName: e.target.value })}
                className="mt-1"
                placeholder="Nom"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Prénom du propriétaire *</Label>
              <Input
                value={ownerFirstName}
                onChange={(e) => onUpdate({ ownerFirstName: e.target.value })}
                className="mt-1"
                placeholder="Prénom"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Contact téléphonique *</Label>
              <Input
                type="tel"
                value={ownerPhone}
                onChange={(e) => onUpdate({ ownerPhone: e.target.value })}
                className="mt-1"
                placeholder="+225 XX XX XX XX"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Type d'emploi *</Label>
              <Select
                value={ownerEmployment}
                onValueChange={(v) => onUpdate({ ownerEmploymentType: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {employmentOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Date d'effet</Label>
              <Input
                value={ownerEffectiveDate ? format(new Date(ownerEffectiveDate), "dd/MM/yyyy", { locale: fr }) : ""}
                disabled
                className="mt-1 bg-muted"
                placeholder="—"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Durée du contrat</Label>
              <Input
                value={ownerPeriodicity ? periodicityLabels[ownerPeriodicity] || ownerPeriodicity : ""}
                disabled
                className="mt-1 bg-muted"
                placeholder="—"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permis de conduire */}
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
        <Button onClick={goNext} disabled={!isSubStep5Valid()} className="gap-2">
          Continuer vers Signature
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
    </div>
  );
};
