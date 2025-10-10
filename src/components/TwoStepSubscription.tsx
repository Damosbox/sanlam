import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowRight, ArrowLeft, Shield, Loader2 } from "lucide-react";
import { CoverageCustomizer } from "@/components/CoverageCustomizer";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Coverage {
  included: boolean;
  limit?: string;
  description?: string;
  optional?: boolean;
  price_modifier?: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  base_premium: number;
  description: string;
  coverages: Record<string, Coverage>;
}

export const TwoStepSubscription = ({ selectedProduct: preSelectedProduct }: { selectedProduct?: Product | null } = {}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(preSelectedProduct || null);
  const [customizedCoverages, setCustomizedCoverages] = useState<Record<string, Coverage>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    paymentMethod: ""
  });

  // Update selected product when preSelectedProduct changes
  useEffect(() => {
    if (preSelectedProduct) {
      setSelectedProduct(preSelectedProduct);
      setStep(1); // Go directly to customization step
    }
  }, [preSelectedProduct]);

  // Fetch all products
  const { data: products, isLoading } = useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true);
      
      if (error) throw error;
      return data?.map(product => ({
        ...product,
        coverages: product.coverages as unknown as Record<string, Coverage>
      })) as Product[];
    },
  });

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setStep(1);
  };

  const handleCustomizationComplete = (customizedProduct: Product, coverages: Record<string, Coverage>) => {
    setSelectedProduct(customizedProduct);
    setCustomizedCoverages(coverages);
    setStep(2);
  };

  const handlePersonalInfoNext = () => {
    if (formData.name && formData.phone) {
      setStep(3);
    } else {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.paymentMethod) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner un mode de paiement",
        variant: "destructive"
      });
      return;
    }

    if (!selectedProduct) {
      toast({
        title: "Erreur",
        description: "Aucun produit sélectionné",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour souscrire",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Generate unique policy number
      const policyNumber = `POL-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      
      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      // Insert subscription
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          product_id: selectedProduct.id,
          policy_number: policyNumber,
          monthly_premium: calculateTotalPremium(),
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'active',
          selected_coverages: customizedCoverages as any,
          payment_method: formData.paymentMethod
        } as any);

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Souscription réussie",
        description: `Votre police ${policyNumber} a été créée avec succès.`,
      });

      // Reset form and redirect to policies tab
      setStep(0);
      setSelectedProduct(null);
      setCustomizedCoverages({});
      setFormData({
        name: "",
        phone: "",
        email: "",
        paymentMethod: ""
      });

      // Refresh the page to show new subscription
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la souscription",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalPremium = () => {
    if (!selectedProduct) return 0;
    let total = selectedProduct.base_premium;
    Object.values(customizedCoverages).forEach((coverage) => {
      if (coverage.price_modifier) {
        total += coverage.price_modifier;
      }
    });
    return total;
  };

  if (isLoading) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement des produits...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      {step > 0 && (
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
                {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
              </div>
              <span className="font-medium text-sm">Personnalisation</span>
            </div>
            <div className="h-px bg-border flex-1" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>
                {step > 2 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
              </div>
              <span className="font-medium text-sm">Informations</span>
            </div>
            <div className="h-px bg-border flex-1" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-muted'}`}>
                3
              </div>
              <span className="font-medium text-sm">Confirmation</span>
            </div>
          </div>
        </Card>
      )}

      {/* Step 0: Product Selection */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Choisissez votre produit</CardTitle>
            <CardDescription>Sélectionnez le produit d'assurance qui vous intéresse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products?.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary"
                  onClick={() => handleProductSelect(product)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="text-sm">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3">
                      <div className="text-2xl font-bold text-primary">
                        {product.base_premium.toLocaleString()} FCFA
                      </div>
                      <div className="text-xs text-muted-foreground">par mois</div>
                    </div>
                    <Button className="w-full" size="sm">
                      Personnaliser <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Coverage Customization */}
      {step === 1 && selectedProduct && (
        <CoverageCustomizer
          product={selectedProduct}
          onCustomizationComplete={handleCustomizationComplete}
          onBack={() => setStep(0)}
        />
      )}

      {/* Step 2: Personal Information */}
      {step === 2 && selectedProduct && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Vos informations</h2>
          <div className="space-y-4">
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
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
              </Button>
              <Button onClick={handlePersonalInfoNext} className="flex-1">
                Continuer <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Confirmation & Payment */}
      {step === 3 && selectedProduct && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Confirmation</h2>
          
          {/* Summary */}
          <Card className="mb-6 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Récapitulatif de votre souscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Produit</p>
                <p className="font-semibold">{selectedProduct.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Garanties sélectionnées</p>
                <div className="space-y-1">
                  {Object.entries(customizedCoverages).map(([key, coverage]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{coverage.description || key}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">Prime mensuelle</p>
                <p className="text-2xl font-bold text-primary">
                  {calculateTotalPremium().toLocaleString()} FCFA
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="paymentMethod">Mode de paiement *</Label>
              <Input
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                placeholder="Mobile Money, Visa, Prélèvement auto"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={isSubmitting}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmer la souscription
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
