import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { GuidedSalesState, PackObsequesData } from "../types";
import { ArrowRight, Cross, User, Users, Heart } from "lucide-react";
import { useState } from "react";

interface PackObsequesNeedsStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<PackObsequesData>) => void;
  onNext: () => void;
}

export const PackObsequesNeedsStep = ({ state, onUpdate, onNext }: PackObsequesNeedsStepProps) => {
  const packObsequesData = state.packObsequesData || {
    periodicity: "mensuelle",
    nombreEnfants: 0,
    nombreAscendants: 0,
    subscriberName: "",
    subscriberFamilySituation: "",
    subscriberBirthDate: "",
    subscriberIdType: "",
    subscriberIdNumber: "",
    subscriberProfession: "",
    subscriberEmail: "",
    subscriberPhone: "",
    insuredIsDifferent: false,
    spouseBirthDate: ""
  };

  const [insuredIsDifferent, setInsuredIsDifferent] = useState(packObsequesData.insuredIsDifferent || false);

  const handleInsuredToggle = (checked: boolean) => {
    setInsuredIsDifferent(checked);
    onUpdate({ insuredIsDifferent: checked });
  };

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Cross className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Pack Obsèques</h2>
          <p className="text-muted-foreground">Garantie Décès avec Pack + IAD</p>
        </div>
      </div>

      {/* Section 1: Paramètres du devis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Paramètres du devis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Périodicité de paiement</Label>
            <Select
              value={packObsequesData.periodicity}
              onValueChange={(value) => onUpdate({ periodicity: value as PackObsequesData["periodicity"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensuelle">Mensuelle</SelectItem>
                <SelectItem value="trimestrielle">Trimestrielle</SelectItem>
                <SelectItem value="semestrielle">Semestrielle</SelectItem>
                <SelectItem value="annuelle">Annuelle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre d'enfants à couvrir</Label>
              <Input
                type="number"
                min={0}
                max={10}
                value={packObsequesData.nombreEnfants}
                onChange={(e) => onUpdate({ nombreEnfants: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre d'ascendants à couvrir</Label>
              <Input
                type="number"
                min={0}
                max={4}
                value={packObsequesData.nombreAscendants}
                onChange={(e) => onUpdate({ nombreAscendants: Number(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Informations du souscripteur */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informations du souscripteur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input
                value={packObsequesData.subscriberName}
                onChange={(e) => onUpdate({ subscriberName: e.target.value })}
                placeholder="Nom et prénoms"
              />
            </div>
            <div className="space-y-2">
              <Label>Date de naissance</Label>
              <Input
                type="date"
                value={packObsequesData.subscriberBirthDate}
                onChange={(e) => onUpdate({ subscriberBirthDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Situation familiale</Label>
              <Select
                value={packObsequesData.subscriberFamilySituation}
                onValueChange={(value) => onUpdate({ subscriberFamilySituation: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
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
              <Label>Profession</Label>
              <Input
                value={packObsequesData.subscriberProfession}
                onChange={(e) => onUpdate({ subscriberProfession: e.target.value })}
                placeholder="Profession"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de pièce d'identité</Label>
              <Select
                value={packObsequesData.subscriberIdType}
                onValueChange={(value) => onUpdate({ subscriberIdType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cni">CNI</SelectItem>
                  <SelectItem value="passeport">Passeport</SelectItem>
                  <SelectItem value="permis">Permis de conduire</SelectItem>
                  <SelectItem value="carte_sejour">Carte de séjour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Numéro de pièce</Label>
              <Input
                value={packObsequesData.subscriberIdNumber}
                onChange={(e) => onUpdate({ subscriberIdNumber: e.target.value })}
                placeholder="N° de pièce"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={packObsequesData.subscriberEmail}
                onChange={(e) => onUpdate({ subscriberEmail: e.target.value })}
                placeholder="email@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={packObsequesData.subscriberPhone}
                onChange={(e) => onUpdate({ subscriberPhone: e.target.value })}
                placeholder="+225 00 00 00 00 00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Assuré différent du souscripteur */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Assuré principal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="insuredIsDifferent" 
              checked={insuredIsDifferent}
              onCheckedChange={handleInsuredToggle}
            />
            <Label htmlFor="insuredIsDifferent" className="text-sm font-normal cursor-pointer">
              L'assuré est différent du souscripteur
            </Label>
          </div>

          {insuredIsDifferent && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom complet de l'assuré</Label>
                  <Input
                    value={packObsequesData.insuredName || ""}
                    onChange={(e) => onUpdate({ insuredName: e.target.value })}
                    placeholder="Nom et prénoms"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de naissance de l'assuré</Label>
                  <Input
                    type="date"
                    value={packObsequesData.insuredBirthDate || ""}
                    onChange={(e) => onUpdate({ insuredBirthDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de pièce d'identité</Label>
                  <Select
                    value={packObsequesData.insuredIdType || ""}
                    onValueChange={(value) => onUpdate({ insuredIdType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cni">CNI</SelectItem>
                      <SelectItem value="passeport">Passeport</SelectItem>
                      <SelectItem value="permis">Permis de conduire</SelectItem>
                      <SelectItem value="carte_sejour">Carte de séjour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Numéro de pièce</Label>
                  <Input
                    value={packObsequesData.insuredIdNumber || ""}
                    onChange={(e) => onUpdate({ insuredIdNumber: e.target.value })}
                    placeholder="N° de pièce"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Profession de l'assuré</Label>
                  <Input
                    value={packObsequesData.insuredProfession || ""}
                    onChange={(e) => onUpdate({ insuredProfession: e.target.value })}
                    placeholder="Profession"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={packObsequesData.insuredEmail || ""}
                      onChange={(e) => onUpdate({ insuredEmail: e.target.value })}
                      placeholder="Email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      value={packObsequesData.insuredPhone || ""}
                      onChange={(e) => onUpdate({ insuredPhone: e.target.value })}
                      placeholder="Téléphone"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Conjoint (si situation familiale = marié) */}
      {(packObsequesData.subscriberFamilySituation === "marie") && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Informations du conjoint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Date de naissance du conjoint</Label>
              <Input
                type="date"
                value={packObsequesData.spouseBirthDate || ""}
                onChange={(e) => onUpdate({ spouseBirthDate: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={onNext} size="lg" className="gap-2">
          Continuer
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
