import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

export const TwoStepSubscription = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    productType: "",
    name: "",
    phone: "",
    email: "",
    // Step 2
    coverage: "",
    monthlyPremium: "",
    paymentMethod: ""
  });

  const handleNext = () => {
    if (step === 1 && formData.name && formData.phone && formData.productType) {
      setStep(2);
    } else {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = () => {
    if (formData.coverage && formData.paymentMethod) {
      toast({
        title: "Souscription réussie",
        description: "Votre demande a été enregistrée. Un conseiller vous contactera sous 24h.",
      });
      // Reset form
      setStep(1);
      setFormData({
        productType: "",
        name: "",
        phone: "",
        email: "",
        coverage: "",
        monthlyPremium: "",
        paymentMethod: ""
      });
    } else {
      toast({
        title: "Informations manquantes",
        description: "Veuillez compléter toutes les informations",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Souscription en 2 étapes</h2>
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
              {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
            </div>
            <span className="font-medium">Informations</span>
          </div>
          <div className="h-px bg-border flex-1" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>
              2
            </div>
            <span className="font-medium">Couverture</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="productType">Type de produit *</Label>
            <Input
              id="productType"
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              placeholder="Auto, Habitation, Santé..."
            />
          </div>
          <div>
            <Label htmlFor="name">Nom complet *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jean Dupont"
            />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+225 07 XX XX XX XX"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jean.dupont@example.com"
            />
          </div>
          <Button onClick={handleNext} className="w-full">
            Continuer <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="coverage">Niveau de couverture *</Label>
            <Input
              id="coverage"
              value={formData.coverage}
              onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
              placeholder="Basique, Standard, Premium"
            />
          </div>
          <div>
            <Label htmlFor="monthlyPremium">Prime mensuelle estimée</Label>
            <Input
              id="monthlyPremium"
              value={formData.monthlyPremium}
              onChange={(e) => setFormData({ ...formData, monthlyPremium: e.target.value })}
              placeholder="15 000 FCFA"
            />
          </div>
          <div>
            <Label htmlFor="paymentMethod">Mode de paiement *</Label>
            <Input
              id="paymentMethod"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              placeholder="Mobile Money, Visa, Prélèvement auto"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Souscrire
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
