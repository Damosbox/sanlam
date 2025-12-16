import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Car, Home, HeartPulse, Shield, CalendarIcon, Search, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { GuidedSalesState, ProductType } from "../types";

// Liste des véhicules populaires pour l'autocomplétion
const POPULAR_VEHICLES = [
  { brand: "Toyota", model: "Corolla" },
  { brand: "Toyota", model: "Camry" },
  { brand: "Toyota", model: "RAV4" },
  { brand: "Toyota", model: "Land Cruiser" },
  { brand: "Toyota", model: "Hilux" },
  { brand: "Toyota", model: "Yaris" },
  { brand: "Peugeot", model: "208" },
  { brand: "Peugeot", model: "308" },
  { brand: "Peugeot", model: "3008" },
  { brand: "Peugeot", model: "5008" },
  { brand: "Peugeot", model: "508" },
  { brand: "Renault", model: "Clio" },
  { brand: "Renault", model: "Duster" },
  { brand: "Renault", model: "Megane" },
  { brand: "Renault", model: "Captur" },
  { brand: "Mercedes", model: "Classe C" },
  { brand: "Mercedes", model: "Classe E" },
  { brand: "Mercedes", model: "GLE" },
  { brand: "Mercedes", model: "GLC" },
  { brand: "BMW", model: "Série 3" },
  { brand: "BMW", model: "Série 5" },
  { brand: "BMW", model: "X3" },
  { brand: "BMW", model: "X5" },
  { brand: "Hyundai", model: "Tucson" },
  { brand: "Hyundai", model: "Santa Fe" },
  { brand: "Hyundai", model: "i10" },
  { brand: "Hyundai", model: "i20" },
  { brand: "Kia", model: "Sportage" },
  { brand: "Kia", model: "Sorento" },
  { brand: "Kia", model: "Picanto" },
  { brand: "Honda", model: "CR-V" },
  { brand: "Honda", model: "Civic" },
  { brand: "Honda", model: "Accord" },
  { brand: "Nissan", model: "Qashqai" },
  { brand: "Nissan", model: "X-Trail" },
  { brand: "Nissan", model: "Patrol" },
  { brand: "Volkswagen", model: "Golf" },
  { brand: "Volkswagen", model: "Polo" },
  { brand: "Volkswagen", model: "Tiguan" },
  { brand: "Ford", model: "Ranger" },
  { brand: "Ford", model: "Focus" },
  { brand: "Ford", model: "Fiesta" },
  { brand: "Mitsubishi", model: "Pajero" },
  { brand: "Mitsubishi", model: "L200" },
  { brand: "Suzuki", model: "Swift" },
  { brand: "Suzuki", model: "Vitara" },
  { brand: "Suzuki", model: "Jimny" },
];

interface NeedsAnalysisStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["needsAnalysis"]>) => void;
}

export const NeedsAnalysisStep = ({ state, onUpdate }: NeedsAnalysisStepProps) => {
  const { needsAnalysis } = state;
  const [vehicleSearchOpen, setVehicleSearchOpen] = useState(false);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState("");

  // Valeur affichée dans le champ
  const vehicleDisplayValue = useMemo(() => {
    if (needsAnalysis.vehicleBrand && needsAnalysis.vehicleModel) {
      return `${needsAnalysis.vehicleBrand} ${needsAnalysis.vehicleModel}`;
    }
    if (needsAnalysis.vehicleBrand) {
      return needsAnalysis.vehicleBrand;
    }
    return "";
  }, [needsAnalysis.vehicleBrand, needsAnalysis.vehicleModel]);

  // Filtrer les suggestions
  const filteredVehicles = useMemo(() => {
    if (!vehicleSearchTerm) return POPULAR_VEHICLES.slice(0, 10);
    const search = vehicleSearchTerm.toLowerCase();
    return POPULAR_VEHICLES.filter(
      v => v.brand.toLowerCase().includes(search) || v.model.toLowerCase().includes(search) || `${v.brand} ${v.model}`.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [vehicleSearchTerm]);

  const handleSelectVehicle = (brand: string, model: string) => {
    onUpdate({ vehicleBrand: brand, vehicleModel: model });
    setVehicleSearchOpen(false);
    setVehicleSearchTerm("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Besoin</h1>
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
              {/* Row 1: Marque + Modèle unifié avec autocomplétion */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Véhicule (Marque & Modèle)
                </Label>
                <Popover open={vehicleSearchOpen} onOpenChange={setVehicleSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={vehicleSearchOpen}
                      className="w-full justify-start text-left font-normal"
                    >
                      <Search className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                      {vehicleDisplayValue || <span className="text-muted-foreground">Rechercher un véhicule...</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="ex: Toyota Corolla, Peugeot 3008..." 
                        value={vehicleSearchTerm}
                        onValueChange={setVehicleSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-2 text-center">
                            <p className="text-sm text-muted-foreground mb-2">Véhicule non trouvé</p>
                            {vehicleSearchTerm && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const parts = vehicleSearchTerm.trim().split(/\s+/);
                                  const brand = parts[0] || vehicleSearchTerm;
                                  const model = parts.slice(1).join(" ") || "";
                                  onUpdate({ vehicleBrand: brand, vehicleModel: model });
                                  setVehicleSearchOpen(false);
                                  setVehicleSearchTerm("");
                                }}
                              >
                                Utiliser "{vehicleSearchTerm}"
                              </Button>
                            )}
                          </div>
                        </CommandEmpty>
                        <CommandGroup heading="Véhicules populaires">
                          {filteredVehicles.map((vehicle) => (
                            <CommandItem
                              key={`${vehicle.brand}-${vehicle.model}`}
                              onSelect={() => handleSelectVehicle(vehicle.brand, vehicle.model)}
                              className="cursor-pointer"
                            >
                              <Car className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{vehicle.brand}</span>
                              <span className="ml-1 text-muted-foreground">{vehicle.model}</span>
                              {needsAnalysis.vehicleBrand === vehicle.brand && needsAnalysis.vehicleModel === vehicle.model && (
                                <Check className="ml-auto h-4 w-4 text-primary" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Row 2: Usage */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6">

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

              {/* Row 2: Date mise en circulation + Valeur vénale */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Date de mise en circulation
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !needsAnalysis.vehicleFirstCirculationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {needsAnalysis.vehicleFirstCirculationDate ? (
                          format(new Date(needsAnalysis.vehicleFirstCirculationDate), "PPP", { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={needsAnalysis.vehicleFirstCirculationDate ? new Date(needsAnalysis.vehicleFirstCirculationDate) : undefined}
                        onSelect={(date) => onUpdate({ vehicleFirstCirculationDate: date?.toISOString() })}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Valeur vénale
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Valeur actuelle du véhicule"
                      value={needsAnalysis.vehicleVenalValue || ""}
                      onChange={(e) => onUpdate({ vehicleVenalValue: Number(e.target.value) })}
                      className="pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      FCFA
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Valeur neuve + BNS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Valeur neuve
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Valeur à l'achat neuf"
                      value={needsAnalysis.vehicleNewValue || ""}
                      onChange={(e) => onUpdate({ vehicleNewValue: Number(e.target.value) })}
                      className="pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      FCFA
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    BNS (Bonus)
                  </Label>
                  <Select
                    value={needsAnalysis.bonusMalus || "bonus_0"}
                    onValueChange={(v) => onUpdate({ bonusMalus: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le BNS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bonus_50">Bonus 50%</SelectItem>
                      <SelectItem value="bonus_40">Bonus 40%</SelectItem>
                      <SelectItem value="bonus_30">Bonus 30%</SelectItem>
                      <SelectItem value="bonus_25">Bonus 25%</SelectItem>
                      <SelectItem value="bonus_20">Bonus 20%</SelectItem>
                      <SelectItem value="bonus_15">Bonus 15%</SelectItem>
                      <SelectItem value="bonus_10">Bonus 10%</SelectItem>
                      <SelectItem value="bonus_5">Bonus 5%</SelectItem>
                      <SelectItem value="bonus_0">0% (Neutre)</SelectItem>
                      <SelectItem value="malus_25">Malus 25%</SelectItem>
                      <SelectItem value="malus_50">Malus 50%</SelectItem>
                      <SelectItem value="malus_100">Malus 100%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Puissance fiscale + Nombre de places */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Puissance fiscale
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="ex: 7"
                      value={needsAnalysis.vehicleFiscalPower || ""}
                      onChange={(e) => onUpdate({ vehicleFiscalPower: Number(e.target.value) })}
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      CV
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Nombre de places
                  </Label>
                  <Input
                    type="number"
                    placeholder="ex: 5"
                    value={needsAnalysis.vehicleSeats || ""}
                    onChange={(e) => onUpdate({ vehicleSeats: Number(e.target.value) })}
                  />
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
