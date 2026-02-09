import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Home, HeartPulse, Shield, CalendarIcon, Plane } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { GuidedSalesState, ProductType, QuoteType, GenderType, EmploymentType, EnergyType, ContractPeriodicity } from "../types";

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

// Employment type options
const employmentTypeOptions: { value: EmploymentType; label: string }[] = [
  { value: "fonctionnaire", label: "Fonctionnaire" },
  { value: "salarie", label: "Salarié" },
  { value: "exploitant_agricole", label: "Exploitant agricole" },
  { value: "artisan", label: "Artisan" },
  { value: "religieux", label: "Religieux" },
  { value: "retraite", label: "Retraité" },
  { value: "sans_profession", label: "Sans profession" },
  { value: "agent_commercial", label: "Agent commercial" },
  { value: "autres", label: "Autres catégories socioprofessionnelles" },
];

// Fiscal power options (1-8)
const fiscalPowerOptions = [1, 2, 3, 4, 5, 6, 7, 8];

// Vehicle seats options (3-8)
const vehicleSeatsOptions = [3, 4, 5, 6, 7, 8];

// Contract duration options
const contractDurationOptions: { value: ContractPeriodicity; label: string }[] = [
  { value: "1_month", label: "1 mois" },
  { value: "3_months", label: "3 mois" },
  { value: "6_months", label: "6 mois" },
  { value: "1_year", label: "12 mois" },
];

export const NeedsAnalysisStep = ({
  state,
  onUpdate,
  onNext
}: NeedsAnalysisStepProps) => {
  const { needsAnalysis } = state;
  const productType = needsAnalysis.productType || "auto";
  const ProductIcon = productTypeConfig[productType]?.icon || Car;
  const productLabel = productTypeConfig[productType]?.label || "Assurance";

  // Render Auto fields - SanlamAllianz exact structure (17 fields)
  const renderAutoFields = () => (
    <div className="space-y-6">
      {/* 1. Type de devis - Radio */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          1. Type de devis <span className="text-destructive">*</span>
        </Label>
        <RadioGroup 
          value={needsAnalysis.quoteType || "auto"} 
          onValueChange={(v) => onUpdate({ quoteType: v as QuoteType })}
          className="flex"
        >
          <div className="flex-1">
            <RadioGroupItem value="auto" id="quote_auto" className="peer sr-only" />
            <Label 
              htmlFor="quote_auto" 
              className="flex items-center justify-center rounded-l-md border border-r-0 py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors"
            >
              Devis Auto
            </Label>
          </div>
          <div className="flex-1">
            <RadioGroupItem value="2_3_roues" id="quote_2_3_roues" className="peer sr-only" />
            <Label 
              htmlFor="quote_2_3_roues" 
              className="flex items-center justify-center rounded-r-md border py-3 px-4 cursor-pointer peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted transition-colors"
            >
              Devis 2 & 3 Roues
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* 2-4. VTC / Entreprise / Déjà client - Row of 3 dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            2. Le véhicule est-il un VTC ? <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={needsAnalysis.isVTC === undefined ? "" : needsAnalysis.isVTC ? "oui" : "non"} 
            onValueChange={(v) => onUpdate({ isVTC: v === "oui" })}
          >
            <SelectTrigger className={needsAnalysis.isVTC ? "border-destructive" : ""}>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oui">Oui</SelectItem>
              <SelectItem value="non">Non</SelectItem>
            </SelectContent>
          </Select>
          {needsAnalysis.isVTC && (
            <p className="text-xs text-destructive font-medium">
              Les véhicules VTC ne sont pas éligibles à ce parcours.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            3. Appartient à entreprise ? <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={needsAnalysis.belongsToCompany === undefined ? "" : needsAnalysis.belongsToCompany ? "oui" : "non"} 
            onValueChange={(v) => onUpdate({ belongsToCompany: v === "oui" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oui">Oui</SelectItem>
              <SelectItem value="non">Non</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            4. Déjà client SanlamAllianz ? <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={needsAnalysis.isExistingClient === undefined ? "" : needsAnalysis.isExistingClient ? "oui" : "non"} 
            onValueChange={(v) => onUpdate({ isExistingClient: v === "oui" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oui">Oui</SelectItem>
              <SelectItem value="non">Non</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 5-6. Accident 36 mois / Sexe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            5. Accident 36 derniers mois ? <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={needsAnalysis.hasAccident36Months === undefined ? "" : needsAnalysis.hasAccident36Months ? "oui" : "non"} 
            onValueChange={(v) => onUpdate({ hasAccident36Months: v === "oui" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oui">Oui</SelectItem>
              <SelectItem value="non">Non</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            6. Sexe <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={needsAnalysis.gender || ""} 
            onValueChange={(v) => onUpdate({ gender: v as GenderType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feminin">Féminin</SelectItem>
              <SelectItem value="masculin">Masculin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 7. Type d'emploi - Full width */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          7. Type d'emploi <span className="text-destructive">*</span>
        </Label>
        <Select 
          value={needsAnalysis.employmentType || ""} 
          onValueChange={(v) => onUpdate({ employmentType: v as EmploymentType })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            {employmentTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 8-9. Énergie / Puissance fiscale */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            8. Énergie <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={needsAnalysis.vehicleEnergy || ""} 
            onValueChange={(v) => onUpdate({ vehicleEnergy: v as EnergyType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="essence">Essence</SelectItem>
              <SelectItem value="gasoil">Gasoil</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            9. Puissance fiscale (en CV) <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={needsAnalysis.vehicleFiscalPower?.toString() || ""} 
            onValueChange={(v) => onUpdate({ vehicleFiscalPower: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {fiscalPowerOptions.map((cv) => (
                <SelectItem key={cv} value={cv.toString()}>{cv} CV</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 10-11. Date circulation / Places */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            10. Date de première mise en circulation <span className="text-destructive">*</span>
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
                {needsAnalysis.vehicleFirstCirculationDate 
                  ? format(new Date(needsAnalysis.vehicleFirstCirculationDate), "dd/MM/yyyy", { locale: fr }) 
                  : <span>DD/MM/YYYY</span>
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar 
                mode="single" 
                selected={needsAnalysis.vehicleFirstCirculationDate ? new Date(needsAnalysis.vehicleFirstCirculationDate) : undefined} 
                onSelect={(date) => onUpdate({ vehicleFirstCirculationDate: date?.toISOString() })} 
                disabled={(date) => date > new Date()} 
                initialFocus 
                fromYear={1990}
                toYear={new Date().getFullYear()}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            11. Nombre de places <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={needsAnalysis.vehicleSeats?.toString() || ""} 
            onValueChange={(v) => onUpdate({ vehicleSeats: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {vehicleSeatsOptions.map((seats) => (
                <SelectItem key={seats} value={seats.toString()}>{seats}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 12-13. Date effet / Durée */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            12. Date d'effet <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full justify-start text-left font-normal", 
                  !needsAnalysis.effectiveDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {needsAnalysis.effectiveDate 
                  ? format(new Date(needsAnalysis.effectiveDate), "dd/MM/yyyy", { locale: fr }) 
                  : <span>DD/MM/YYYY</span>
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar 
                mode="single" 
                selected={needsAnalysis.effectiveDate ? new Date(needsAnalysis.effectiveDate) : undefined} 
                onSelect={(date) => onUpdate({ effectiveDate: date?.toISOString() })} 
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} 
                initialFocus 
                fromYear={new Date().getFullYear()}
                toYear={new Date().getFullYear() + 1}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            13. Durée du contrat <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={needsAnalysis.contractPeriodicity || ""} 
            onValueChange={(v) => onUpdate({ contractPeriodicity: v as ContractPeriodicity })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {contractDurationOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 14-15. Valeurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            14. Valeur à neuf <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input 
              type="number" 
              placeholder="Valeur numérique" 
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
            15. Valeur vénale <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input 
              type="number" 
              placeholder="Valeur numérique" 
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

      {/* 16-17. Toit panoramique / GPS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            16. Toit panoramique ? <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={needsAnalysis.hasPanoramicRoof === undefined ? "" : needsAnalysis.hasPanoramicRoof ? "oui" : "non"} 
            onValueChange={(v) => onUpdate({ hasPanoramicRoof: v === "oui" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oui">Oui</SelectItem>
              <SelectItem value="non">Non</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            17. Protection GPS ? <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={needsAnalysis.hasGPSProtection === undefined ? "" : needsAnalysis.hasGPSProtection ? "oui" : "non"} 
            onValueChange={(v) => onUpdate({ hasGPSProtection: v === "oui" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oui">Oui</SelectItem>
              <SelectItem value="non">Non</SelectItem>
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
            Région
          </Label>
          <Select value={needsAnalysis.region || "abidjan"} onValueChange={v => onUpdate({
            region: v
          })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="abidjan">Abidjan</SelectItem>
              <SelectItem value="autres">Autres régions</SelectItem>
            </SelectContent>
          </Select>
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
          <Input type="number" value={needsAnalysis.beneficiaryCount || ""} onChange={e => onUpdate({
            beneficiaryCount: Number(e.target.value)
          })} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Niveau de couverture souhaité
          </Label>
          <Select value={needsAnalysis.coverageLevel || "standard"} onValueChange={v => onUpdate({
            coverageLevel: v as any
          })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="essentiel">Essentiel</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
            <SelectItem value="autres">Autres régions</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderVieFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Capital souhaité (FCFA)
          </Label>
          <Input type="number" value={needsAnalysis.capitalAmount || ""} onChange={e => onUpdate({
            capitalAmount: Number(e.target.value)
          })} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Durée (années)
          </Label>
          <Select value={needsAnalysis.duration?.toString() || "10"} onValueChange={v => onUpdate({
            duration: Number(v)
          })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 ans</SelectItem>
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
            Situation familiale
          </Label>
          <Select value={needsAnalysis.familyStatus || "celibataire"} onValueChange={v => onUpdate({
            familyStatus: v
          })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="celibataire">Célibataire</SelectItem>
              <SelectItem value="marie">Marié(e)</SelectItem>
              <SelectItem value="divorce">Divorcé(e)</SelectItem>
              <SelectItem value="veuf">Veuf/Veuve</SelectItem>
            </SelectContent>
          </Select>
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
              <SelectItem value="protection">Protection familiale</SelectItem>
              <SelectItem value="epargne">Constitution d'épargne</SelectItem>
              <SelectItem value="mixte">Protection + Épargne</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderMRHFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Valeur du bâtiment (FCFA)
          </Label>
          <Input type="number" value={needsAnalysis.buildingValue || ""} onChange={e => onUpdate({
            buildingValue: Number(e.target.value)
          })} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Valeur du contenu (FCFA)
          </Label>
          <Input type="number" value={needsAnalysis.contentValue || ""} onChange={e => onUpdate({
            contentValue: Number(e.target.value)
          })} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Loyer annuel (FCFA)
          </Label>
          <Input type="number" value={needsAnalysis.rentValue || ""} onChange={e => onUpdate({
            rentValue: Number(e.target.value)
          })} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Nombre de pièces
          </Label>
          <Input type="number" value={needsAnalysis.numberOfRooms || ""} onChange={e => onUpdate({
            numberOfRooms: Number(e.target.value)
          })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Adresse du bien
        </Label>
        <Input value={needsAnalysis.propertyAddress || ""} onChange={e => onUpdate({
          propertyAddress: e.target.value
        })} placeholder="Adresse complète" />
      </div>
    </div>
  );

  const renderAssistanceVoyageFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Zone de voyage
          </Label>
          <Select value={needsAnalysis.travelZone || "afrique"} onValueChange={v => onUpdate({
            travelZone: v as any
          })}>
            <SelectTrigger>
              <SelectValue />
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
            Durée du séjour (jours)
          </Label>
          <Input type="number" value={needsAnalysis.numberOfDays || ""} onChange={e => onUpdate({
            numberOfDays: Number(e.target.value)
          })} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Date de départ
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !needsAnalysis.departureDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {needsAnalysis.departureDate 
                  ? format(new Date(needsAnalysis.departureDate), "dd/MM/yyyy", { locale: fr }) 
                  : <span>Sélectionner...</span>
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar 
                mode="single" 
                selected={needsAnalysis.departureDate ? new Date(needsAnalysis.departureDate) : undefined} 
                onSelect={(date) => onUpdate({ departureDate: date?.toISOString() })} 
                disabled={(date) => date < new Date()} 
                initialFocus 
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Date de retour
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !needsAnalysis.returnDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {needsAnalysis.returnDate 
                  ? format(new Date(needsAnalysis.returnDate), "dd/MM/yyyy", { locale: fr }) 
                  : <span>Sélectionner...</span>
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar 
                mode="single" 
                selected={needsAnalysis.returnDate ? new Date(needsAnalysis.returnDate) : undefined} 
                onSelect={(date) => onUpdate({ returnDate: date?.toISOString() })} 
                disabled={(date) => date < new Date()} 
                initialFocus 
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );

  const renderProductSpecificFields = () => {
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
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <ProductIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Étape 1/2 - Besoin</h1>
          <p className="text-muted-foreground">{productLabel}</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {renderProductSpecificFields()}
        </CardContent>
      </Card>
    </div>
  );
};
