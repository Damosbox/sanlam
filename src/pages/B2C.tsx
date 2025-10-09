import { useState, useEffect } from "react";
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
import { PeopleLikeYouRecommendations } from "@/components/PeopleLikeYouRecommendations";
import { UserAttributesForm } from "@/components/UserAttributesForm";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const B2C = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeSubscribeTab, setActiveSubscribeTab] = useState("compare");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch profile from profiles table
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && profileData) {
          setProfile(profileData);
        }

        // Fetch user subscriptions with product details
        const { data: subsData, error: subsError } = await supabase
          .from('subscriptions')
          .select(`
            *,
            products (
              id,
              name,
              category
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!subsError && subsData) {
          setSubscriptions(subsData);
        }

        // Fetch user claims
        const { data: claimsData, error: claimsError } = await supabase
          .from('claims')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!claimsError && claimsData) {
          setClaims(claimsData);
        }
      }
      setLoading(false);
    };

    fetchUserAndProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data) setProfile(data);
            });

          supabase
            .from('subscriptions')
            .select(`
              *,
              products (
                id,
                name,
                category
              )
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data) setSubscriptions(data);
            });

          supabase
            .from('claims')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data) setClaims(data);
            });
        }, 0);
      } else {
        setProfile(null);
        setSubscriptions([]);
        setClaims([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || "Utilisateur";

  // Calculate dynamic stats
  const activeSubscriptionsCount = subscriptions.filter(sub => sub.status === 'active').length;
  const totalMonthlyPremium = subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + (parseFloat(sub.monthly_premium) || 0), 0);

  // Count pending/in-progress claims (not Draft, not Closed, not Rejected)
  const pendingClaimsCount = claims.filter(
    claim => !['Draft', 'Closed', 'Rejected'].includes(claim.status)
  ).length;

  // Calculate next payment date from active subscriptions
  const getNextPaymentInfo = () => {
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    if (activeSubscriptions.length === 0) return { days: 0, text: 'Aucune échéance' };

    const now = new Date();
    let nearestDate: Date | null = null;
    let nearestDays = Infinity;

    activeSubscriptions.forEach(sub => {
      const endDate = new Date(sub.end_date);
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0 && diffDays < nearestDays) {
        nearestDays = diffDays;
        nearestDate = endDate;
      }
    });

    if (!nearestDate) return { days: 0, text: 'Aucune échéance' };

    if (nearestDays === 1) return { days: 1, text: '1 jour' };
    if (nearestDays <= 30) return { days: nearestDays, text: `${nearestDays} jours` };
    
    const months = Math.floor(nearestDays / 30);
    return { days: nearestDays, text: `${months} mois` };
  };

  const nextPayment = getNextPaymentInfo();

  // Calculate annual savings (example: 10% discount for multiple active policies)
  const calculateAnnualSavings = () => {
    if (activeSubscriptionsCount <= 1) return 0;
    const annualPremium = totalMonthlyPremium * 12;
    const discount = 0.10; // 10% discount for multiple policies
    return Math.round(annualPremium * discount);
  };

  const annualSavings = calculateAnnualSavings();

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[hsl(var(--bright-green))]/10 text-[hsl(var(--bright-green))]';
      case 'pending':
        return 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]';
      case 'expired':
      case 'cancelled':
        return 'bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'En attente';
      case 'expired':
        return 'Expirée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

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
            <h1 className="text-3xl font-bold mb-2">Bonjour, {displayName} 👋</h1>
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
            value={activeSubscriptionsCount.toString()}
            icon={Shield}
            trend={activeSubscriptionsCount > 0 ? "Toutes à jour" : "Aucune police"}
            variant={activeSubscriptionsCount > 0 ? "success" : "default"}
          />
          <StatCard
            label={annualSavings > 0 ? "Économies annuelles" : "Montant mensuel"}
            value={annualSavings > 0 ? `${annualSavings.toLocaleString('fr-FR')} FCFA` : `${totalMonthlyPremium.toLocaleString('fr-FR')} FCFA`}
            icon={TrendingUp}
            trend={annualSavings > 0 ? "Multi-polices (-10%)" : "Total de vos primes"}
            variant="success"
          />
          <StatCard
            label="Sinistres en cours"
            value={pendingClaimsCount.toString()}
            icon={AlertCircle}
            trend={pendingClaimsCount > 0 ? "Traitement en cours" : "Aucun sinistre"}
            variant={pendingClaimsCount > 0 ? "warning" : "success"}
          />
          <StatCard
            label="Prochain paiement"
            value={nextPayment.text}
            icon={Clock}
            trend={subscriptions.some(sub => sub.payment_method) ? `Auto. ${subscriptions.find(sub => sub.payment_method)?.payment_method}` : "À configurer"}
            variant={nextPayment.days > 0 && nextPayment.days <= 7 ? "warning" : "default"}
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Mes polices</h2>
                <Button onClick={() => setActiveSubscribeTab("compare")} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle souscription
                </Button>
              </div>
              {subscriptions.length === 0 ? (
                <Card className="p-8 text-center">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucune police active</h3>
                  <p className="text-muted-foreground mb-4">
                    Souscrivez à votre première assurance pour protéger ce qui compte le plus
                  </p>
                  <Button onClick={() => setActiveSubscribeTab("compare")}>
                    Découvrir nos offres
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((subscription) => (
                    <Card key={subscription.id} className="p-6 transition-base hover:shadow-medium">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{subscription.products?.name || 'Assurance'}</h3>
                            <p className="text-sm text-muted-foreground">Police #{subscription.policy_number}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                          {getStatusText(subscription.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Prime mensuelle</p>
                          <p className="font-semibold">{parseFloat(subscription.monthly_premium).toLocaleString('fr-FR')} FCFA</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Échéance</p>
                          <p className="font-semibold">{formatDate(subscription.end_date)}</p>
                        </div>
                      </div>
                      {subscription.payment_method && (
                        <div className="mt-3 text-sm">
                          <p className="text-muted-foreground">Mode de paiement : <span className="font-medium text-foreground">{subscription.payment_method}</span></p>
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <FileText className="w-4 h-4 mr-2" />
                          Détails
                        </Button>
                        {subscription.status === 'active' && (
                          <Button size="sm" className="flex-1">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Payer
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Recommendations & Actions */}
          <div className="space-y-6">
            <UserAttributesForm />
            
            <PeopleLikeYouRecommendations 
              onSubscribe={(productId) => {
                // Find the product and set it as selected
                supabase
                  .from('products')
                  .select('*')
                  .eq('id', productId)
                  .single()
                  .then(({ data }) => {
                    if (data) {
                      setSelectedProduct(data);
                      setActiveSubscribeTab("subscribe");
                    }
                  });
              }}
            />

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
