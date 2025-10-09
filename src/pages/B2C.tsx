import { useState } from "react";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileText, AlertCircle, Sparkles, MessageCircle, CreditCard, TrendingUp, Clock, Plus } from "lucide-react";
import dashboardImage from "@/assets/dashboard-preview.jpg";
import { AIDiagnostic } from "@/components/AIDiagnostic";
import { TwoStepSubscription } from "@/components/TwoStepSubscription";
import { ClaimOCR } from "@/components/ClaimOCR";
import { OmnichannelChat } from "@/components/OmnichannelChat";
import { ProductComparator } from "@/components/ProductComparator";
import { useNavigate } from "react-router-dom";

const B2C = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeSubscribeTab, setActiveSubscribeTab] = useState("compare");

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setActiveSubscribeTab("subscribe");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        {/* Welcome Banner */}
        <Card className="p-8 mb-8 gradient-activated text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img src={dashboardImage} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Bonjour, Marie 👋</h1>
            <p className="text-white/90 mb-6">Bienvenue sur votre espace assuré personnalisé</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" size="lg">
                <Sparkles className="w-4 h-4 mr-2" />
                Diagnostic IA gratuit
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <MessageCircle className="w-4 h-4 mr-2" />
                Support 24/7
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            label="Polices actives"
            value="3"
            icon={Shield}
            trend="Toutes à jour"
            variant="success"
          />
          <StatCard
            label="Économies annuelles"
            value="24 500 FCFA"
            icon={TrendingUp}
            trend="+12% vs année dernière"
            variant="success"
          />
          <StatCard
            label="Sinistres en cours"
            value="1"
            icon={AlertCircle}
            trend="Traitement en cours"
            variant="warning"
          />
          <StatCard
            label="Prochain paiement"
            value="15 jours"
            icon={Clock}
            trend="Auto. Mobile Money"
            variant="default"
          />
        </div>

        {/* Features Tabs */}
        <Tabs defaultValue="dashboard" className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="diagnostic">Diagnostic IA</TabsTrigger>
            <TabsTrigger value="subscribe">Souscrire</TabsTrigger>
            <TabsTrigger value="claim">Sinistre OCR</TabsTrigger>
            <TabsTrigger value="policies">Mes polices</TabsTrigger>
          </TabsList>

          <TabsContent value="diagnostic" className="mt-6">
            <AIDiagnostic />
          </TabsContent>

          <TabsContent value="subscribe" className="mt-6">
            <Tabs value={activeSubscribeTab} onValueChange={setActiveSubscribeTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="compare">Comparer les offres</TabsTrigger>
                <TabsTrigger value="subscribe">Souscrire directement</TabsTrigger>
              </TabsList>
              <TabsContent value="compare" className="mt-6">
                <ProductComparator onProductSelect={handleProductSelect} />
              </TabsContent>
              <TabsContent value="subscribe" className="mt-6">
                <TwoStepSubscription selectedProduct={selectedProduct} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="claim" className="mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Déclaration de sinistre</h3>
                  <p className="text-muted-foreground">
                    Déclarez un sinistre en quelques étapes avec l'aide de l'IA
                  </p>
                </div>
                <Button onClick={() => navigate('/b2c/claims/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle déclaration
                </Button>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">📸 Scanner OCR</p>
                  <p className="text-muted-foreground text-xs">
                    Extrais automatiquement les infos de vos documents
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">🎯 Zones interactives</p>
                  <p className="text-muted-foreground text-xs">
                    Sélectionnez visuellement les zones endommagées
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">📄 Rapport auto</p>
                  <p className="text-muted-foreground text-xs">
                    Génération automatique de votre pré-déclaration
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Vue d'ensemble</h3>
              <p className="text-muted-foreground">Accédez rapidement à toutes vos fonctionnalités via les onglets ci-dessus.</p>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="mt-6">
            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Policies */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Mes polices</h2>
              <div className="space-y-4">
                <Card className="p-6 transition-base hover:shadow-medium">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Assurance Auto</h3>
                        <p className="text-sm text-muted-foreground">Police #ASA-2024-1582</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[hsl(var(--bright-green))]/10 text-[hsl(var(--bright-green))]">
                      Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Prime mensuelle</p>
                      <p className="font-semibold">15 000 FCFA</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Échéance</p>
                      <p className="font-semibold">20 Déc 2025</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="w-4 h-4 mr-2" />
                      Détails
                    </Button>
                    <Button size="sm" className="flex-1">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payer
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 transition-base hover:shadow-medium">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Assurance Habitation</h3>
                        <p className="text-sm text-muted-foreground">Police #ASH-2024-3421</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[hsl(var(--bright-green))]/10 text-[hsl(var(--bright-green))]">
                      Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Prime mensuelle</p>
                      <p className="font-semibold">8 500 FCFA</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Échéance</p>
                      <p className="font-semibold">15 Jan 2026</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="w-4 h-4 mr-2" />
                      Détails
                    </Button>
                    <Button size="sm" className="flex-1">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payer
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Right Column - Recommendations & Actions */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Recommandations IA</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Nous avons analysé votre profil et identifié des opportunités pour vous
              </p>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-background border">
                  <p className="font-medium text-sm mb-1">Assurance Santé Famille</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Économisez 15% avec notre offre famille
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    En savoir plus
                  </Button>
                </div>
                <div className="p-3 rounded-lg bg-background border">
                  <p className="font-medium text-sm mb-1">Protection Mobile</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Complétez votre couverture pour 2 500 FCFA/mois
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Découvrir
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Déclarer un sinistre
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Télécharger attestations
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contacter un conseiller
                </Button>
              </div>
            </Card>
          </div>
        </div>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Omnichannel Chat Widget */}
      <OmnichannelChat />
    </div>
  );
};

export default B2C;
