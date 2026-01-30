import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { User, CreditCard, Car, FileText, ChevronRight, Upload } from "lucide-react";
import { GuidedSalesState, LicenseCategory } from "../types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DriverInfoStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["subscription"]>) => void;
  onNext: () => void;
}

const licenseCategories: LicenseCategory[] = ["A", "B", "C", "D", "E", "AB", "ABCD", "ABCDE"];

export const DriverInfoStep = ({ state, onUpdate, onNext }: DriverInfoStepProps) => {
  const { subscription } = state;
  const licenseDate = subscription.licenseIssueDate ? new Date(subscription.licenseIssueDate) : undefined;

  const isValid = () => {
    return (
      subscription.driverName &&
      subscription.licenseNumber &&
      subscription.licenseCategory &&
      subscription.licenseIssueDate &&
      subscription.vehicleRegistrationNumber &&
      subscription.vehicleChassisNumber
    );
  };

  const handleFileUpload = (field: "vehicleRegistrationDocument" | "honorDeclaration") => {
    // Mock file upload
    const fileName = field === "vehicleRegistrationDocument" ? "carte_grise.pdf" : "declaration_honneur.pdf";
    onUpdate({ [field]: fileName });
    toast.success(`${fileName} téléchargé avec succès`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Informations Conducteur</h1>
        <p className="text-muted-foreground mt-1">
          Identité, permis et documents du véhicule
        </p>
      </div>

      {/* Identité */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Identité du conducteur</h3>
          </div>
          
          <div>
            <Label htmlFor="driver-name" className="text-sm font-medium">Nom de l'assuré *</Label>
            <Input
              id="driver-name"
              placeholder="Nom complet"
              value={subscription.driverName}
              onChange={(e) => onUpdate({ driverName: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="habitual-driver"
              checked={subscription.isHabitualDriver}
              onCheckedChange={(checked) => onUpdate({ isHabitualDriver: checked as boolean })}
            />
            <Label htmlFor="habitual-driver" className="text-sm">
              Le souscripteur est le conducteur habituel
            </Label>
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="license-number" className="text-sm font-medium">Numéro de permis *</Label>
              <Input
                id="license-number"
                placeholder="Ex: 123456789"
                value={subscription.licenseNumber}
                onChange={(e) => onUpdate({ licenseNumber: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Catégorie *</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Date d'obtention *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !licenseDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {licenseDate ? format(licenseDate, "PPP", { locale: fr }) : "Choisir une date"}
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
            <div>
              <Label htmlFor="license-place" className="text-sm font-medium">Lieu de délivrance</Label>
              <Input
                id="license-place"
                placeholder="Ex: Abidjan"
                value={subscription.licenseIssuePlace}
                onChange={(e) => onUpdate({ licenseIssuePlace: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Véhicule détails */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Car className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Détails du véhicule</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="registration" className="text-sm font-medium">N° d'immatriculation *</Label>
              <Input
                id="registration"
                placeholder="Ex: AB 1234 CD"
                value={subscription.vehicleRegistrationNumber}
                onChange={(e) => onUpdate({ vehicleRegistrationNumber: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="chassis" className="text-sm font-medium">N° de châssis *</Label>
              <Input
                id="chassis"
                placeholder="Ex: WVWZZZ3CZWE123456"
                value={subscription.vehicleChassisNumber}
                onChange={(e) => onUpdate({ vehicleChassisNumber: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Documents</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Carte grise</Label>
              <div className="mt-1">
                {subscription.vehicleRegistrationDocument ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">{subscription.vehicleRegistrationDocument}</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => handleFileUpload("vehicleRegistrationDocument")}
                  >
                    <Upload className="h-4 w-4" />
                    Télécharger
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Déclaration d'honneur</Label>
              <div className="mt-1">
                {subscription.honorDeclaration ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">{subscription.honorDeclaration}</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => handleFileUpload("honorDeclaration")}
                  >
                    <Upload className="h-4 w-4" />
                    Télécharger
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!isValid()} className="gap-2">
          Continuer vers Adresse
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
