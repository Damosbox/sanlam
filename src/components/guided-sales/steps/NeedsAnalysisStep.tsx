import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Home, HeartPulse, Shield, CalendarIcon, Search, Check, Plane } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { GuidedSalesState, ProductType } from "../types";
import { VEHICLES, PRIORITY_BRANDS, formatYearRange, getAvailableYears, Vehicle } from "@/data/vehicles";

interface NeedsAnalysisStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["needsAnalysis"]>) => void;
  onNext: () => void;
}

// Product type icons and labels
const productTypeConfig: Record<ProductType, { icon: typeof Car; label: string }> = {
  auto: { icon: Car, label: "Assurance Auto" },
  habitation: { icon: Home, label: "Assurance Habitation" },
  sante: { icon: HeartPulse, label: "Assurance Santé" },
  vie: { icon: Shield, label: "Assurance Vie" },
  mrh: { icon: Home, label: "Multirisque Habitation" },
  assistance_voyage: { icon: Plane, label: "Assistance Voyage" },
};

export const NeedsAnalysisStep = ({
  state,
  onUpdate,
  onNext
}: NeedsAnalysisStepProps) => {
  const { needsAnalysis } = state;
  const productType = needsAnalysis.productType || "auto";
  const ProductIcon = productTypeConfig[productType]?.icon || Car;
  const productLabel = productTypeConfig[productType]?.label || "Assurance";

  const [vehicleSearchOpen, setVehicleSearchOpen] = useState(false);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState("");

  // Valeur affichée dans le champ
  const vehicleDisplayValue = useMemo(() => {
    if (needsAnalysis.vehicleBrand && needsAnalysis.vehicleModel) {
      const yearSuffix = needsAnalysis.vehicleYear ? ` (${needsAnalysis.vehicleYear})` : "";
      return `${needsAnalysis.vehicleBrand} ${needsAnalysis.vehicleModel}${yearSuffix}`;
    }
    if (needsAnalysis.vehicleBrand) {
      return needsAnalysis.vehicleBrand;
    }
    return "";
  }, [needsAnalysis.vehicleBrand, needsAnalysis.vehicleModel, needsAnalysis.vehicleYear]);

  // Véhicule sélectionné pour afficher les années disponibles
  const selectedVehicle = useMemo(() => {
    if (needsAnalysis.vehicleBrand && needsAnalysis.vehicleModel) {
      return VEHICLES.find(
        v => v.brand === needsAnalysis.vehicleBrand && v.model === needsAnalysis.vehicleModel
      );
    }
    return null;
  }, [needsAnalysis.vehicleBrand, needsAnalysis.vehicleModel]);

  // Années disponibles pour le véhicule sélectionné
  const availableYears = useMemo(() => {
    if (selectedVehicle) {
      return getAvailableYears(selectedVehicle.startYear, selectedVehicle.endYear);
    }
    return [];
  }, [selectedVehicle]);

  // Filtrer les suggestions avec groupement par marque
  const filteredVehicles = useMemo(() => {
    const search = vehicleSearchTerm.toLowerCase().trim();
    
    let results: Vehicle[];
    if (!search) {
      // Sans recherche, afficher les marques prioritaires
      results = VEHICLES.filter(v => PRIORITY_BRANDS.includes(v.brand)).slice(0, 20);
    } else {
      results = VEHICLES.filter(v => 
        v.brand.toLowerCase().includes(search) || 
        v.model.toLowerCase().includes(search) || 
        `${v.brand} ${v.model}`.toLowerCase().includes(search)
      ).slice(0, 20);
    }

    // Trier par marques prioritaires puis alphabétique
    return results.sort((a, b) => {
      const aPriority = PRIORITY_BRANDS.indexOf(a.brand);
      const bPriority = PRIORITY_BRANDS.indexOf(b.brand);
      if (aPriority !== -1 && bPriority !== -1) {
        if (aPriority !== bPriority) return aPriority - bPriority;
      } else if (aPriority !== -1) return -1;
      else if (bPriority !== -1) return 1;
      
      if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
      return a.model.localeCompare(b.model);
    });
  }, [vehicleSearchTerm]);

  const handleSelectVehicle = useCallback((vehicle: Vehicle) => {
    onUpdate({
      vehicleBrand: vehicle.brand,
      vehicleModel: vehicle.model,
      vehicleYear: undefined
    });
    setVehicleSearchOpen(false);
    setVehicleSearchTerm("");
  }, [onUpdate]);

  // Render product-specific fields - Ordre Excel exact
  const renderAutoFields = () => (
    <div className="space-y-6">
      {/* 1. Marque et modèle avec autocomplétion */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          1. Véhicule (Marque & Modèle)
        </Label>
        <Popover open={vehicleSearchOpen} onOpenChange={setVehicleSearchOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={vehicleSearchOpen} className="w-full justify-start text-left font-normal">
              <Search className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
              {vehicleDisplayValue || <span className="text-muted-foreground">Rechercher un véhicule...</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput placeholder="ex: Toyota Corolla, Peugeot 3008..." value={vehicleSearchTerm} onValueChange={setVehicleSearchTerm} />
              <CommandList>
                <CommandEmpty>
                  <div className="p-2 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Véhicule non trouvé</p>
                    {vehicleSearchTerm && (
                      <Button variant="outline" size="sm" onClick={() => {
                        const parts = vehicleSearchTerm.trim().split(/\s+/);
                        const brand = parts[0] || vehicleSearchTerm;
                        const model = parts.slice(1).join(" ") || "";
                        onUpdate({
                          vehicleBrand: brand,
                          vehicleModel: model
                        });
                        setVehicleSearchOpen(false);
                        setVehicleSearchTerm("");
                      }}>
                        Utiliser "{vehicleSearchTerm}"
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup heading="Véhicules populaires">
                  {filteredVehicles.map(vehicle => (
                    <CommandItem key={`${vehicle.brand}-${vehicle.model}`} onSelect={() => handleSelectVehicle(vehicle)} className="cursor-pointer">
                      <Car className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{vehicle.brand}</span>
                      <span className="ml-1 text-muted-foreground">{vehicle.model}</span>
                      {needsAnalysis.vehicleBrand === vehicle.brand && needsAnalysis.vehicleModel === vehicle.model && <Check className="ml-auto h-4 w-4 text-primary" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* 2. Usage */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            2. Usage
          </Label>
          <RadioGroup value={needsAnalysis.vehicleUsage || "prive"} onValueChange={v => onUpdate({
            vehicleUsage: v as any
          })} className="flex">
            <div className="flex-1">
              <RadioGroupItem value="prive" id="prive" className="peer sr-only" />
              <Label htmlFor="prive" className="flex items-center justify-center rounded-l-md border border-r-0 py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors">
                Privé / Trajet
              </Label>
            </div>
            <div className="flex-1">
              <RadioGroupItem value="professionnel" id="professionnel" className="peer sr-only" />
              <Label htmlFor="professionnel" className="flex items-center justify-center rounded-r-md border py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors">
                Professionnel
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* 3. Puissance fiscale + 4. Énergie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            3. Puissance fiscale
          </Label>
          <div className="relative">
            <Input type="number" placeholder="ex: 7" value={needsAnalysis.vehicleFiscalPower || ""} onChange={e => onUpdate({
              vehicleFiscalPower: Number(e.target.value)
            })} className="pr-10" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              CV
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            4. Énergie
          </Label>
          <Select value={needsAnalysis.vehicleEnergy || "essence"} onValueChange={v => onUpdate({
            vehicleEnergy: v as any
          })}>
            <SelectTrigger>
              <SelectValue placeholder="Type d'énergie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="essence">Essence</SelectItem>
              <SelectItem value="diesel">Diesel</SelectItem>
              <SelectItem value="electrique">Électrique</SelectItem>
              <SelectItem value="hybride">Hybride</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 5. Valeur Neuve + 6. Valeur Vénale */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            5. Valeur neuve
          </Label>
          <div className="relative">
            <Input type="number" placeholder="Valeur à l'achat neuf" value={needsAnalysis.vehicleNewValue || ""} onChange={e => onUpdate({
              vehicleNewValue: Number(e.target.value)
            })} className="pr-14" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              FCFA
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            6. Valeur vénale
          </Label>
          <div className="relative">
            <Input type="number" placeholder="Valeur actuelle du véhicule" value={needsAnalysis.vehicleVenalValue || ""} onChange={e => onUpdate({
              vehicleVenalValue: Number(e.target.value)
            })} className="pr-14" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              FCFA
            </span>
          </div>
        </div>
      </div>

      {/* 7. Date mise en circulation + 8. Nombre de places */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            7. Date de mise en circulation
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !needsAnalysis.vehicleFirstCirculationDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {needsAnalysis.vehicleFirstCirculationDate ? format(new Date(needsAnalysis.vehicleFirstCirculationDate), "PPP", {
                  locale: fr
                }) : <span>Sélectionner une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar 
                mode="single" 
                selected={needsAnalysis.vehicleFirstCirculationDate ? new Date(needsAnalysis.vehicleFirstCirculationDate) : undefined} 
                onSelect={date => onUpdate({
                  vehicleFirstCirculationDate: date?.toISOString()
                })} 
                disabled={date => date > new Date()} 
                initialFocus 
                fromYear={1990}
                toYear={new Date().getFullYear()}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            8. Nombre de places
          </Label>
          <Input type="number" placeholder="ex: 5" value={needsAnalysis.vehicleSeats || ""} onChange={e => onUpdate({
            vehicleSeats: Number(e.target.value)
          })} />
        </div>
      </div>

      {/* 9. BNS + 10. Catégorie socio-professionnelle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            9. BNS (Bonus)
          </Label>
          <Select value={needsAnalysis.bonusMalus || "bonus_0"} onValueChange={v => onUpdate({
            bonusMalus: v
          })}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner le BNS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bonus_0">0% (Neutre)</SelectItem>
              <SelectItem value="bonus_10">Bonus 10%</SelectItem>
              <SelectItem value="bonus_19">Bonus 19%</SelectItem>
              <SelectItem value="bonus_25">Bonus 25%</SelectItem>
              <SelectItem value="bonus_30">Bonus 30%</SelectItem>
              <SelectItem value="bonus_35">Bonus 35%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            10. Catégorie socio-professionnelle
          </Label>
          <Select value={needsAnalysis.socioProfessionalCategory || ""} onValueChange={v => onUpdate({
            socioProfessionalCategory: v
          })}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="salarie_public">Salarié public</SelectItem>
              <SelectItem value="salarie_prive">Salarié privé</SelectItem>
              <SelectItem value="commercant">Commerçant</SelectItem>
              <SelectItem value="profession_liberale">Profession libérale</SelectItem>
              <SelectItem value="artisan">Artisan</SelectItem>
              <SelectItem value="agriculteur">Agriculteur</SelectItem>
              <SelectItem value="retraite">Retraité</SelectItem>
              <SelectItem value="etudiant">Étudiant</SelectItem>
              <SelectItem value="sans_emploi">Sans emploi</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderHabitationFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Type de logement
          </Label>
          <Select value={needsAnalysis.housingType || "appartement"} onValueChange={v => onUpdate({
            housingType: v as any
          })}>
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
          <Input type="number" value={needsAnalysis.surface || ""} onChange={e => onUpdate({
            surface: Number(e.target.value)
          })} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Matériaux de construction
          </Label>
          <Select value={needsAnalysis.materials || "dur"} onValueChange={v => onUpdate({
            materials: v as any
          })}>
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
            <Input type="number" value={needsAnalysis.contentValue || ""} onChange={e => onUpdate({
              contentValue: Number(e.target.value)
            })} className="pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              FCFA
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSanteFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Nombre de bénéficiaires
          </Label>
          <Input type="number" value={needsAnalysis.beneficiaryCount || 1} onChange={e => onUpdate({
            beneficiaryCount: Number(e.target.value)
          })} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Région de résidence
          </Label>
          <Select value={needsAnalysis.region || "abidjan"} onValueChange={v => onUpdate({
            region: v
          })}>
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
        <RadioGroup value={needsAnalysis.coverageLevel || "standard"} onValueChange={v => onUpdate({
          coverageLevel: v as any
        })} className="flex">
          <div className="flex-1">
            <RadioGroupItem value="essentiel" id="essentiel" className="peer sr-only" />
            <Label htmlFor="essentiel" className="flex items-center justify-center rounded-l-md border border-r-0 py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors">
              Essentiel
            </Label>
          </div>
          <div className="flex-1">
            <RadioGroupItem value="standard" id="standard-sante" className="peer sr-only" />
            <Label htmlFor="standard-sante" className="flex items-center justify-center border-y py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors">
              Standard
            </Label>
          </div>
          <div className="flex-1">
            <RadioGroupItem value="premium" id="premium-sante" className="peer sr-only" />
            <Label htmlFor="premium-sante" className="flex items-center justify-center rounded-r-md border border-l-0 py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors">
              Premium
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const renderVieFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Capital souhaité
          </Label>
          <div className="relative">
            <Input type="number" value={needsAnalysis.capitalAmount || ""} onChange={e => onUpdate({
              capitalAmount: Number(e.target.value)
            })} className="pr-8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              FCFA
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Durée
          </Label>
          <Select value={String(needsAnalysis.duration || 15)} onValueChange={v => onUpdate({
            duration: Number(v)
          })}>
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
          <RadioGroup value={needsAnalysis.isSmoker ? "oui" : "non"} onValueChange={v => onUpdate({
            isSmoker: v === "oui"
          })} className="flex">
            <div className="flex-1">
              <RadioGroupItem value="non" id="non-fumeur" className="peer sr-only" />
              <Label htmlFor="non-fumeur" className="flex items-center justify-center rounded-l-md border border-r-0 py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors">
                Non
              </Label>
            </div>
            <div className="flex-1">
              <RadioGroupItem value="oui" id="oui-fumeur" className="peer sr-only" />
              <Label htmlFor="oui-fumeur" className="flex items-center justify-center rounded-r-md border py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors">
                Oui
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Objectif
          </Label>
          <Select value={needsAnalysis.objective || "protection"} onValueChange={v => onUpdate({
            objective: v as any
          })}>
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
    </div>
  );

  const renderMRHFields = () => (
    <div className="space-y-6">
      {/* Row 1: Valeur bâtiment / Loyer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Valeur du bâtiment / Loyer annuel
          </Label>
          <div className="relative">
            <Input type="number" placeholder="Valeur ou loyer annuel" value={needsAnalysis.buildingValue || needsAnalysis.rentValue || ""} onChange={e => onUpdate({
              buildingValue: Number(e.target.value)
            })} className="pr-14" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              FCFA
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Valeur du contenu
          </Label>
          <div className="relative">
            <Input type="number" placeholder="Valeur des biens mobiliers" value={needsAnalysis.contentValue || ""} onChange={e => onUpdate({
              contentValue: Number(e.target.value)
            })} className="pr-14" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              FCFA
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Équipement informatique + Nombre de pièces */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Tous risques informatique (Optionnel)
          </Label>
          <div className="relative">
            <Input type="number" placeholder="Valeur équipements IT" value={needsAnalysis.itEquipmentValue || ""} onChange={e => onUpdate({
              itEquipmentValue: Number(e.target.value)
            })} className="pr-14" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              FCFA
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Nombre de pièces
          </Label>
          <Input type="number" placeholder="ex: 4" value={needsAnalysis.numberOfRooms || ""} onChange={e => onUpdate({
            numberOfRooms: Number(e.target.value)
          })} />
        </div>
      </div>

      {/* Row 3: Adresse géographique */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Adresse géographique
        </Label>
        <Input placeholder="Adresse complète du bien" value={needsAnalysis.propertyAddress || ""} onChange={e => onUpdate({
          propertyAddress: e.target.value
        })} />
      </div>
    </div>
  );

  const renderAssistanceVoyageFields = () => (
    <div className="space-y-6">
      {/* Row 1: Destination + Date de naissance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Destination - Zone
          </Label>
          <Select value={needsAnalysis.travelZone || "afrique"} onValueChange={v => onUpdate({
            travelZone: v as any
          })}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner la zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="afrique">Afrique</SelectItem>
              <SelectItem value="europe">Europe</SelectItem>
              <SelectItem value="amerique">Amérique</SelectItem>
              <SelectItem value="asie">Asie</SelectItem>
              <SelectItem value="monde">Monde entier</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Date de naissance
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !needsAnalysis.travelerBirthDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {needsAnalysis.travelerBirthDate ? format(new Date(needsAnalysis.travelerBirthDate), "PPP", {
                  locale: fr
                }) : <span>Sélectionner une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={needsAnalysis.travelerBirthDate ? new Date(needsAnalysis.travelerBirthDate) : undefined} onSelect={date => onUpdate({
                travelerBirthDate: date?.toISOString()
              })} disabled={date => date > new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Row 2: Date de départ + Nombre de jours */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Date de départ
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !needsAnalysis.departureDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {needsAnalysis.departureDate ? format(new Date(needsAnalysis.departureDate), "PPP", {
                  locale: fr
                }) : <span>Sélectionner une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={needsAnalysis.departureDate ? new Date(needsAnalysis.departureDate) : undefined} onSelect={date => onUpdate({
                departureDate: date?.toISOString()
              })} disabled={date => date < new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Nombre de jours
          </Label>
          <Input type="number" placeholder="ex: 14" value={needsAnalysis.numberOfDays || ""} onChange={e => onUpdate({
            numberOfDays: Number(e.target.value)
          })} />
        </div>
      </div>

      {/* Row 3: Date de retour + Numéro de passeport */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Date de retour
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !needsAnalysis.returnDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {needsAnalysis.returnDate ? format(new Date(needsAnalysis.returnDate), "PPP", {
                  locale: fr
                }) : <span>Sélectionner une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={needsAnalysis.returnDate ? new Date(needsAnalysis.returnDate) : undefined} onSelect={date => onUpdate({
                returnDate: date?.toISOString()
              })} disabled={date => date < new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            N° Passeport
          </Label>
          <Input placeholder="Numéro de passeport" value={needsAnalysis.passportNumber || ""} onChange={e => onUpdate({
            passportNumber: e.target.value
          })} />
        </div>
      </div>
    </div>
  );

  const renderProductFields = () => {
    switch (productType) {
      case "auto":
        return renderAutoFields();
      case "habitation":
        return renderHabitationFields();
      case "sante":
        return renderSanteFields();
      case "vie":
        return renderVieFields();
      case "mrh":
        return renderMRHFields();
      case "assistance_voyage":
        return renderAssistanceVoyageFields();
      default:
        return renderAutoFields();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ProductIcon className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{productLabel}</h1>
        </div>
        <p className="text-muted-foreground">
          Définissez les informations du risque pour générer une cotation.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {renderProductFields()}
        </CardContent>
      </Card>

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={onNext} size="lg">
          Passer à la couverture
        </Button>
      </div>
    </div>
  );
};
