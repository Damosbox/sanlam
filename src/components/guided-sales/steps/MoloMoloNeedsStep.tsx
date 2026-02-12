import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { GuidedSalesState } from "../types";

// Legacy type kept for compatibility - this component is no longer used
interface MoloMoloData {
  montantCotisation: number;
  periodicity: string;
  dureeContrat: number;
  subscriberName: string;
  subscriberFamilySituation: string;
  subscriberBirthDate: string;
  subscriberIdType: string;
  subscriberIdNumber: string;
  subscriberProfession: string;
  subscriberEmail: string;
  subscriberPhone: string;
  beneficiaries: Array<{ name: string; relationship: string; percentage: number }>;
}
import { ArrowRight, Heart, PiggyBank, Users, Plus, Trash2, User } from "lucide-react";
import { useState } from "react";

interface MoloMoloNeedsStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<MoloMoloData>) => void;
  onNext: () => void;
}

const COTISATION_PRESETS = [5000, 10000, 15000, 20000, 25000, 30000];
const DUREE_OPTIONS = [5, 10, 15, 20, 25];

interface Beneficiary {
  id: string;
  name: string;
  relationship: string;
  percentage: number;
}

export const MoloMoloNeedsStep = ({ state, onUpdate, onNext }: MoloMoloNeedsStepProps) => {
  const moloMoloData = (state as any).moloMoloData || {
    montantCotisation: 10000,
    periodicity: "mensuelle",
    dureeContrat: 10,
    subscriberName: "",
    subscriberFamilySituation: "",
    subscriberBirthDate: "",
    subscriberIdType: "",
    subscriberIdNumber: "",
    subscriberProfession: "",
    subscriberEmail: "",
    subscriberPhone: "",
    beneficiaries: []
  };

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(
    moloMoloData.beneficiaries?.length > 0 
      ? moloMoloData.beneficiaries.map((b, i) => ({ ...b, id: `ben-${i}` }))
      : [{ id: "ben-0", name: "", relationship: "", percentage: 100 }]
  );

  const addBeneficiary = () => {
    const newBeneficiary: Beneficiary = {
      id: `ben-${Date.now()}`,
      name: "",
      relationship: "",
      percentage: 0
    };
    const updated = [...beneficiaries, newBeneficiary];
    setBeneficiaries(updated);
    onUpdate({ beneficiaries: updated.map(({ id, ...rest }) => rest) });
  };

  const removeBeneficiary = (id: string) => {
    if (beneficiaries.length <= 1) return;
    const updated = beneficiaries.filter(b => b.id !== id);
    setBeneficiaries(updated);
    onUpdate({ beneficiaries: updated.map(({ id: _, ...rest }) => rest) });
  };

  const updateBeneficiary = (id: string, field: keyof Omit<Beneficiary, "id">, value: string | number) => {
    const updated = beneficiaries.map(b => 
      b.id === id ? { ...b, [field]: value } : b
    );
    setBeneficiaries(updated);
    onUpdate({ beneficiaries: updated.map(({ id: _, ...rest }) => rest) });
  };

  const totalPercentage = beneficiaries.reduce((sum, b) => sum + (b.percentage || 0), 0);

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Heart className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Molo Molo</h2>
          <p className="text-muted-foreground">Assurance Vie inclusive (Décès + Épargne)</p>
        </div>
      </div>

      {/* Section 1: Paramètres du contrat */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            Paramètres du contrat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Montant de cotisation */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Montant de cotisation</Label>
            <div className="flex flex-wrap gap-2">
              {COTISATION_PRESETS.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={moloMoloData.montantCotisation === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => onUpdate({ montantCotisation: amount })}
                  className="min-w-[80px]"
                >
                  {amount.toLocaleString()} F
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={moloMoloData.montantCotisation}
                onChange={(e) => onUpdate({ montantCotisation: Number(e.target.value) })}
                className="max-w-[150px]"
              />
              <span className="text-muted-foreground">FCFA</span>
            </div>
          </div>

          {/* Périodicité */}
          <div className="space-y-2">
            <Label>Périodicité de paiement</Label>
            <Select
              value={moloMoloData.periodicity}
              onValueChange={(value) => onUpdate({ periodicity: value as MoloMoloData["periodicity"] })}
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

          {/* Durée du contrat */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <Label>Durée du contrat</Label>
              <span className="font-semibold text-primary">{moloMoloData.dureeContrat} ans</span>
            </div>
            <Slider
              value={[moloMoloData.dureeContrat]}
              onValueChange={(values) => onUpdate({ dureeContrat: values[0] })}
              min={5}
              max={25}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {DUREE_OPTIONS.map((d) => (
                <span key={d}>{d} ans</span>
              ))}
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
                value={moloMoloData.subscriberName}
                onChange={(e) => onUpdate({ subscriberName: e.target.value })}
                placeholder="Nom et prénoms"
              />
            </div>
            <div className="space-y-2">
              <Label>Date de naissance</Label>
              <Input
                type="date"
                value={moloMoloData.subscriberBirthDate}
                onChange={(e) => onUpdate({ subscriberBirthDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Situation familiale</Label>
              <Select
                value={moloMoloData.subscriberFamilySituation}
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
                value={moloMoloData.subscriberProfession}
                onChange={(e) => onUpdate({ subscriberProfession: e.target.value })}
                placeholder="Profession"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de pièce d'identité</Label>
              <Select
                value={moloMoloData.subscriberIdType}
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
                value={moloMoloData.subscriberIdNumber}
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
                value={moloMoloData.subscriberEmail}
                onChange={(e) => onUpdate({ subscriberEmail: e.target.value })}
                placeholder="email@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={moloMoloData.subscriberPhone}
                onChange={(e) => onUpdate({ subscriberPhone: e.target.value })}
                placeholder="+225 00 00 00 00 00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Bénéficiaires */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Bénéficiaires / Ayants droit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalPercentage !== 100 && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              ⚠️ Le total des pourcentages doit être égal à 100% (actuellement {totalPercentage}%)
            </div>
          )}

          {beneficiaries.map((beneficiary, index) => (
            <div key={beneficiary.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Bénéficiaire {index + 1}</span>
                {beneficiaries.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBeneficiary(beneficiary.id)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nom complet</Label>
                  <Input
                    value={beneficiary.name}
                    onChange={(e) => updateBeneficiary(beneficiary.id, "name", e.target.value)}
                    placeholder="Nom et prénoms"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Lien de parenté</Label>
                  <Select
                    value={beneficiary.relationship}
                    onValueChange={(value) => updateBeneficiary(beneficiary.id, "relationship", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conjoint">Conjoint(e)</SelectItem>
                      <SelectItem value="enfant">Enfant</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="frere_soeur">Frère/Sœur</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pourcentage (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={beneficiary.percentage}
                    onChange={(e) => updateBeneficiary(beneficiary.id, "percentage", Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addBeneficiary}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un bénéficiaire
          </Button>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={onNext} 
          size="lg" 
          className="gap-2"
          disabled={totalPercentage !== 100}
        >
          Continuer
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
