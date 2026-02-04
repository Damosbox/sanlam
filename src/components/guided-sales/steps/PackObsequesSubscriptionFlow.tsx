import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GuidedSalesState, PackObsequesData, GenderType } from "../types";
import { ChevronLeft, ChevronRight, Upload, User, FileCheck } from "lucide-react";

interface PackObsequesSubscriptionFlowProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<PackObsequesData>) => void;
  onNext: () => void;
}

export const PackObsequesSubscriptionFlow = ({
  state,
  onUpdate,
  onNext
}: PackObsequesSubscriptionFlowProps) => {
  const [subStep, setSubStep] = useState<1 | 2 | 3>(1);
  
  const data = state.packObsequesData!;

  // Sub-step navigation
  const goToNextSubStep = () => {
    if (subStep < 3) {
      setSubStep((subStep + 1) as 1 | 2 | 3);
    }
  };
  
  const goToPrevSubStep = () => {
    if (subStep > 1) {
      setSubStep((subStep - 1) as 1 | 2 | 3);
    }
  };

  // Validation
  const isSubStep1Valid = data.identityDocumentType && data.identityNumber && data.maritalStatus;
  const isSubStep2Valid = data.lastName && data.firstName && data.gender && data.birthDate;
  const isSubStep3Valid = data.birthPlace && data.phone;

  // Render sub-step 1: Pièce d'identité
  const renderSubStep1 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Pièce d'identité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 1. Upload pièce d'identité */}
        <div className="space-y-2">
          <Label>1. Upload pièce d'identité *</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Cliquez ou glissez pour télécharger
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG ou PDF (max 5MB)
            </p>
          </div>
        </div>

        {/* 2. Type de pièce d'identité */}
        <div className="space-y-2">
          <Label>2. Type de pièce d'identité *</Label>
          <Select
            value={data.identityDocumentType}
            onValueChange={(value) => onUpdate({ identityDocumentType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cni">CNI</SelectItem>
              <SelectItem value="passeport">Passeport</SelectItem>
              <SelectItem value="permis">Permis de conduire</SelectItem>
              <SelectItem value="carte_sejour">Carte de séjour</SelectItem>
              <SelectItem value="attestation">Attestation d'identité</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 3. Numéro d'identification */}
        <div className="space-y-2">
          <Label>3. Numéro d'identification *</Label>
          <Input
            value={data.identityNumber}
            onChange={(e) => onUpdate({ identityNumber: e.target.value })}
            placeholder="Numéro de la pièce"
          />
        </div>

        {/* 4. Situation matrimoniale */}
        <div className="space-y-2">
          <Label>4. Situation matrimoniale *</Label>
          <Select
            value={data.maritalStatus}
            onValueChange={(value) => onUpdate({ maritalStatus: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="celibataire">Célibataire</SelectItem>
              <SelectItem value="marie">Marié(e)</SelectItem>
              <SelectItem value="divorce">Divorcé(e)</SelectItem>
              <SelectItem value="veuf">Veuf/Veuve</SelectItem>
              <SelectItem value="concubinage">Concubinage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={goToNextSubStep} disabled={!isSubStep1Valid} className="gap-2">
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render sub-step 2: Vérification informations (pré-rempli)
  const renderSubStep2 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Vérification des informations
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ces informations sont pré-remplies depuis la simulation. Modifiez si nécessaire.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 1. Nom de famille */}
        <div className="space-y-2">
          <Label>1. Nom de famille *</Label>
          <Input
            value={data.lastName}
            onChange={(e) => onUpdate({ lastName: e.target.value })}
            placeholder="Nom de famille"
          />
        </div>

        {/* 2. Prénom */}
        <div className="space-y-2">
          <Label>2. Prénom *</Label>
          <Input
            value={data.firstName}
            onChange={(e) => onUpdate({ firstName: e.target.value })}
            placeholder="Prénom"
          />
        </div>

        {/* 3. Sexe */}
        <div className="space-y-2">
          <Label>3. Sexe *</Label>
          <Select
            value={data.gender}
            onValueChange={(value) => onUpdate({ gender: value as GenderType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="masculin">Masculin</SelectItem>
              <SelectItem value="feminin">Féminin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 4. Date de naissance */}
        <div className="space-y-2">
          <Label>4. Date de naissance *</Label>
          <Input
            type="date"
            value={data.birthDate}
            onChange={(e) => onUpdate({ birthDate: e.target.value })}
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={goToPrevSubStep} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Retour
          </Button>
          <Button onClick={goToNextSubStep} disabled={!isSubStep2Valid} className="gap-2">
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render sub-step 3: Coordonnées
  const renderSubStep3 = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Coordonnées</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 1. Lieu de naissance */}
        <div className="space-y-2">
          <Label>1. Lieu de naissance *</Label>
          <Input
            value={data.birthPlace}
            onChange={(e) => onUpdate({ birthPlace: e.target.value })}
            placeholder="Lieu de naissance"
          />
        </div>

        {/* 2. Numéro de téléphone */}
        <div className="space-y-2">
          <Label>2. Numéro de téléphone *</Label>
          <Input
            value={data.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="+225 00 00 00 00 00"
          />
        </div>

        {/* 3. Situation géographique (optionnel) */}
        <div className="space-y-2">
          <Label>3. Situation géographique <span className="text-muted-foreground">(optionnel)</span></Label>
          <Input
            value={data.geographicLocation || ""}
            onChange={(e) => onUpdate({ geographicLocation: e.target.value })}
            placeholder="Ex: Cocody, Abidjan"
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={goToPrevSubStep} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Retour
          </Button>
          <Button onClick={onNext} disabled={!isSubStep3Valid} className="gap-2">
            Souscrire
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Souscription Pack Obsèques</h2>
        <p className="text-muted-foreground">Étape 1/7 - Informations du souscripteur ({subStep}/3)</p>
      </div>

      {/* Progress indicators */}
      <div className="flex gap-1">
        {[1, 2, 3].map((step) => (
          <div 
            key={step}
            className={`h-1 flex-1 rounded-full transition-colors ${
              subStep >= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Render current sub-step */}
      {subStep === 1 && renderSubStep1()}
      {subStep === 2 && renderSubStep2()}
      {subStep === 3 && renderSubStep3()}
    </div>
  );
};
