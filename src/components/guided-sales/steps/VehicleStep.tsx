import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Bike, ChevronRight } from "lucide-react";
import { GuidedSalesState, QuoteType, EnergyType } from "../types";
import { cn } from "@/lib/utils";

interface VehicleStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["needsAnalysis"]>) => void;
  onNext: () => void;
}

const energyOptions: { value: EnergyType; label: string }[] = [
  { value: "essence", label: "Essence" },
  { value: "gasoil", label: "Gasoil" },
  { value: "hybride", label: "Hybride" },
  { value: "electrique", label: "Électrique" },
];

const fiscalPowerOptions = [1, 2, 3, 4, 5, 6, 7, 8];
const seatsOptions = [3, 4, 5, 6, 7, 8];

export const VehicleStep = ({ state, onUpdate, onNext }: VehicleStepProps) => {
  const { needsAnalysis } = state;

  const isValid = () => {
    return (
      needsAnalysis.quoteType &&
      needsAnalysis.isVTC !== undefined &&
      needsAnalysis.belongsToCompany !== undefined &&
      needsAnalysis.vehicleBrand &&
      needsAnalysis.vehicleModel &&
      needsAnalysis.vehicleEnergy &&
      needsAnalysis.vehicleFiscalPower &&
      needsAnalysis.vehicleSeats &&
      needsAnalysis.vehicleNewValue &&
      needsAnalysis.vehicleVenalValue
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Le Véhicule</h1>
        <p className="text-muted-foreground mt-1">
          Caractéristiques du véhicule à assurer
        </p>
      </div>

      {/* Type de devis */}
      <Card>
        <CardContent className="pt-6">
          <Label className="text-sm font-medium mb-3 block">Type de devis *</Label>
          <RadioGroup
            value={needsAnalysis.quoteType || "auto"}
            onValueChange={(v) => onUpdate({ quoteType: v as QuoteType })}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="auto" id="quote-auto" className="peer sr-only" />
              <Label
                htmlFor="quote-auto"
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all",
                  "hover:border-primary/50 hover:bg-muted/50",
                  "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                )}
              >
                <Car className="h-8 w-8 mb-2 text-primary" />
                <span className="font-semibold">Devis Auto</span>
                <span className="text-xs text-muted-foreground">Véhicules 4 roues</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="2_3_roues" id="quote-2-3" className="peer sr-only" />
              <Label
                htmlFor="quote-2-3"
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all",
                  "hover:border-primary/50 hover:bg-muted/50",
                  "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                )}
              >
                <Bike className="h-8 w-8 mb-2 text-primary" />
                <span className="font-semibold">Devis 2 & 3 Roues</span>
                <span className="text-xs text-muted-foreground">Motos, Scooters</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Usage et propriété */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* VTC */}
            <div>
              <Label className="text-sm font-medium">Est-ce un VTC ? *</Label>
              <Select
                value={needsAnalysis.isVTC === undefined ? "" : needsAnalysis.isVTC ? "oui" : "non"}
                onValueChange={(v) => onUpdate({ isVTC: v === "oui" })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oui">Oui</SelectItem>
                  <SelectItem value="non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entreprise */}
            <div>
              <Label className="text-sm font-medium">Appartient à une entreprise ? *</Label>
              <Select
                value={needsAnalysis.belongsToCompany === undefined ? "" : needsAnalysis.belongsToCompany ? "oui" : "non"}
                onValueChange={(v) => onUpdate({ belongsToCompany: v === "oui" })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oui">Oui</SelectItem>
                  <SelectItem value="non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Caractéristiques techniques */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Caractéristiques techniques</h3>
          
          {/* Marque et Modèle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand" className="text-sm font-medium">Marque *</Label>
              <Input
                id="brand"
                placeholder="Ex: Toyota"
                value={needsAnalysis.vehicleBrand || ""}
                onChange={(e) => onUpdate({ vehicleBrand: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="model" className="text-sm font-medium">Modèle *</Label>
              <Input
                id="model"
                placeholder="Ex: Corolla"
                value={needsAnalysis.vehicleModel || ""}
                onChange={(e) => onUpdate({ vehicleModel: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Énergie et Puissance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Énergie *</Label>
              <Select
                value={needsAnalysis.vehicleEnergy || ""}
                onValueChange={(v) => onUpdate({ vehicleEnergy: v as EnergyType })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {energyOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Puissance fiscale (CV) *</Label>
              <Select
                value={needsAnalysis.vehicleFiscalPower?.toString() || ""}
                onValueChange={(v) => onUpdate({ vehicleFiscalPower: parseInt(v) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {fiscalPowerOptions.map((cv) => (
                    <SelectItem key={cv} value={cv.toString()}>
                      {cv} CV
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nombre de places */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Nombre de places *</Label>
              <Select
                value={needsAnalysis.vehicleSeats?.toString() || ""}
                onValueChange={(v) => onUpdate({ vehicleSeats: parseInt(v) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {seatsOptions.map((seats) => (
                    <SelectItem key={seats} value={seats.toString()}>
                      {seats} places
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valeurs */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold">Valeurs du véhicule</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-value" className="text-sm font-medium">Valeur à neuf *</Label>
              <div className="relative mt-1">
                <Input
                  id="new-value"
                  type="number"
                  placeholder="10 000 000"
                  value={needsAnalysis.vehicleNewValue || ""}
                  onChange={(e) => onUpdate({ vehicleNewValue: parseInt(e.target.value) || 0 })}
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  FCFA
                </span>
              </div>
            </div>
            <div>
              <Label htmlFor="venal-value" className="text-sm font-medium">Valeur vénale *</Label>
              <div className="relative mt-1">
                <Input
                  id="venal-value"
                  type="number"
                  placeholder="7 000 000"
                  value={needsAnalysis.vehicleVenalValue || ""}
                  onChange={(e) => onUpdate({ vehicleVenalValue: parseInt(e.target.value) || 0 })}
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  FCFA
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!isValid()} className="gap-2">
          Continuer vers Profil Risque
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
