import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Car, Home, HeartPulse, Shield } from "lucide-react";
import { GuidedSalesState, ProductType } from "../types";

interface NeedsAnalysisStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["needsAnalysis"]>) => void;
}

export const NeedsAnalysisStep = ({ state, onUpdate }: NeedsAnalysisStepProps) => {
  const { needsAnalysis } = state;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analyse des Besoins</h1>
        <p className="text-muted-foreground mt-1">
          Commençons par définir le profil du client pour activer les recommandations intelligentes.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Product Tabs */}
          <Tabs 
            value={needsAnalysis.productType} 
            onValueChange={(v) => onUpdate({ productType: v as ProductType })}
          >
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto gap-1 p-1">
              <TabsTrigger value="auto" className="gap-1.5 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <Car className="h-4 w-4 shrink-0" />
                <span className="truncate">Auto</span>
              </TabsTrigger>
              <TabsTrigger value="habitation" className="gap-1.5 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <Home className="h-4 w-4 shrink-0" />
                <span className="truncate">Habitation</span>
              </TabsTrigger>
              <TabsTrigger value="sante" className="gap-1.5 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <HeartPulse className="h-4 w-4 shrink-0" />
                <span className="truncate">Santé</span>
              </TabsTrigger>
              <TabsTrigger value="vie" className="gap-1.5 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <Shield className="h-4 w-4 shrink-0" />
                <span className="truncate">Vie</span>
              </TabsTrigger>
            </TabsList>

            {/* Progress bar under tabs */}
            <div className="h-1.5 bg-primary rounded-full mt-4" />

            {/* Common Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Type de client
                </Label>
                <RadioGroup
                  value={needsAnalysis.clientType}
                  onValueChange={(v) => onUpdate({ clientType: v as "prospect" | "existing" })}
                  className="flex"
                >
                  <div className="flex-1">
                    <RadioGroupItem value="prospect" id="prospect" className="peer sr-only" />
                    <Label
                      htmlFor="prospect"
                      className="flex items-center justify-center rounded-l-md border border-r-0 py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors"
                    >
                      Prospect
                    </Label>
                  </div>
                  <div className="flex-1">
                    <RadioGroupItem value="existing" id="existing" className="peer sr-only" />
                    <Label
                      htmlFor="existing"
                      className="flex items-center justify-center rounded-r-md border py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors"
                    >
                      Client Existant
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Budget estimé
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={needsAnalysis.budget}
                    onChange={(e) => onUpdate({ budget: Number(e.target.value) })}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    FCFA/an
                  </span>
                </div>
              </div>
            </div>

            {/* Product-specific fields */}
            <TabsContent value="auto" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Marque / Modèle
                  </Label>
                  <Input
                    placeholder="ex: Peugeot 3008"
                    value={needsAnalysis.vehicleBrand || ""}
                    onChange={(e) => onUpdate({ vehicleBrand: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Usage
                  </Label>
                  <RadioGroup
                    value={needsAnalysis.vehicleUsage || "prive"}
                    onValueChange={(v) => onUpdate({ vehicleUsage: v as any })}
                    className="flex"
                  >
                    <div className="flex-1">
                      <RadioGroupItem value="prive" id="prive" className="peer sr-only" />
                      <Label
                        htmlFor="prive"
                        className="flex items-center justify-center rounded-l-md border border-r-0 py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors"
                      >
                        Privé / Trajet
                      </Label>
                    </div>
                    <div className="flex-1">
                      <RadioGroupItem value="professionnel" id="professionnel" className="peer sr-only" />
                      <Label
                        htmlFor="professionnel"
                        className="flex items-center justify-center rounded-r-md border py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors"
                      >
                        Professionnel
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Année du véhicule
                  </Label>
                  <Input
                    placeholder="ex: 2021"
                    value={needsAnalysis.vehicleYear || ""}
                    onChange={(e) => onUpdate({ vehicleYear: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Valeur estimée
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={needsAnalysis.vehicleValue || ""}
                      onChange={(e) => onUpdate({ vehicleValue: Number(e.target.value) })}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      FCFA
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="habitation" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Type de logement
                  </Label>
                  <Select
                    value={needsAnalysis.housingType || "appartement"}
                    onValueChange={(v) => onUpdate({ housingType: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appartement">Appartement</SelectItem>
                      <SelectItem value="maison">Maison</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Surface (m²)
                  </Label>
                  <Input
                    type="number"
                    value={needsAnalysis.surface || ""}
                    onChange={(e) => onUpdate({ surface: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Matériaux de construction
                  </Label>
                  <Select
                    value={needsAnalysis.materials || "dur"}
                    onValueChange={(v) => onUpdate({ materials: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dur">Dur (béton, brique)</SelectItem>
                      <SelectItem value="semi-dur">Semi-dur</SelectItem>
                      <SelectItem value="leger">Léger (bois, tôle)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Valeur du contenu
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={needsAnalysis.contentValue || ""}
                      onChange={(e) => onUpdate({ contentValue: Number(e.target.value) })}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      FCFA
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sante" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Nombre de bénéficiaires
                  </Label>
                  <Input
                    type="number"
                    value={needsAnalysis.beneficiaryCount || 1}
                    onChange={(e) => onUpdate({ beneficiaryCount: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Région de résidence
                  </Label>
                  <Select
                    value={needsAnalysis.region || "abidjan"}
                    onValueChange={(v) => onUpdate({ region: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="abidjan">Abidjan</SelectItem>
                      <SelectItem value="interieur">Intérieur du pays</SelectItem>
                      <SelectItem value="etranger">Étranger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Niveau de couverture souhaité
                </Label>
                <RadioGroup
                  value={needsAnalysis.coverageLevel || "standard"}
                  onValueChange={(v) => onUpdate({ coverageLevel: v as any })}
                  className="flex"
                >
                  <div className="flex-1">
                    <RadioGroupItem value="essentiel" id="essentiel" className="peer sr-only" />
                    <Label
                      htmlFor="essentiel"
                      className="flex items-center justify-center rounded-l-md border border-r-0 py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors"
                    >
                      Essentiel
                    </Label>
                  </div>
                  <div className="flex-1">
                    <RadioGroupItem value="standard" id="standard-sante" className="peer sr-only" />
                    <Label
                      htmlFor="standard-sante"
                      className="flex items-center justify-center border-y py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors"
                    >
                      Standard
                    </Label>
                  </div>
                  <div className="flex-1">
                    <RadioGroupItem value="premium" id="premium-sante" className="peer sr-only" />
                    <Label
                      htmlFor="premium-sante"
                      className="flex items-center justify-center rounded-r-md border border-l-0 py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors"
                    >
                      Premium
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>

            <TabsContent value="vie" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Capital souhaité
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={needsAnalysis.capitalAmount || ""}
                      onChange={(e) => onUpdate({ capitalAmount: Number(e.target.value) })}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      FCFA
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Durée
                  </Label>
                  <Select
                    value={String(needsAnalysis.duration || 15)}
                    onValueChange={(v) => onUpdate({ duration: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 ans</SelectItem>
                      <SelectItem value="15">15 ans</SelectItem>
                      <SelectItem value="20">20 ans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Fumeur ?
                  </Label>
                  <RadioGroup
                    value={needsAnalysis.isSmoker ? "oui" : "non"}
                    onValueChange={(v) => onUpdate({ isSmoker: v === "oui" })}
                    className="flex"
                  >
                    <div className="flex-1">
                      <RadioGroupItem value="non" id="non-fumeur" className="peer sr-only" />
                      <Label
                        htmlFor="non-fumeur"
                        className="flex items-center justify-center rounded-l-md border border-r-0 py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors"
                      >
                        Non
                      </Label>
                    </div>
                    <div className="flex-1">
                      <RadioGroupItem value="oui" id="oui-fumeur" className="peer sr-only" />
                      <Label
                        htmlFor="oui-fumeur"
                        className="flex items-center justify-center rounded-r-md border py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors"
                      >
                        Oui
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Objectif
                  </Label>
                  <Select
                    value={needsAnalysis.objective || "protection"}
                    onValueChange={(v) => onUpdate({ objective: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="protection">Protection</SelectItem>
                      <SelectItem value="epargne">Épargne</SelectItem>
                      <SelectItem value="mixte">Mixte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
