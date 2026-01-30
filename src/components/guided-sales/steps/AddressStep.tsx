import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Building2, ChevronRight } from "lucide-react";
import { GuidedSalesState, CityType } from "../types";

interface AddressStepProps {
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

export const AddressStep = ({ state, onUpdate, onNext }: AddressStepProps) => {
  const { subscription } = state;

  const isValid = () => {
    return subscription.city && subscription.agencyCode;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Adresse et Localisation</h1>
        <p className="text-muted-foreground mt-1">
          Zone géographique et point de vente
        </p>
      </div>

      {/* Zone géographique */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Zone géographique</h3>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Ville *</Label>
            <Select
              value={subscription.city}
              onValueChange={(v) => onUpdate({ city: v as CityType })}
            >
              <SelectTrigger className="mt-1 max-w-xs">
                <SelectValue placeholder="Sélectionner une ville" />
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

      {/* Code Agence */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Point de vente</h3>
          </div>
          
          <div>
            <Label htmlFor="agency-code" className="text-sm font-medium">Code Agence *</Label>
            <Input
              id="agency-code"
              placeholder="Ex: AG-ABJ-001"
              value={subscription.agencyCode}
              onChange={(e) => onUpdate({ agencyCode: e.target.value })}
              className="mt-1 max-w-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Identifiant du point de vente où la souscription est effectuée
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!isValid()} className="gap-2">
          Continuer vers Paiement
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
