import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileText, AlertCircle, Sparkles, MessageCircle, CreditCard, TrendingUp, Clock, Plus, Trophy } from "lucide-react";
import dashboardImage from "@/assets/dashboard-preview.jpg";
import { AIDiagnostic } from "@/components/AIDiagnostic";
import { TwoStepSubscription } from "@/components/TwoStepSubscription";
import { ClaimOCR } from "@/components/ClaimOCR";
import { OmnichannelChat } from "@/components/OmnichannelChat";
import { ProductComparator } from "@/components/ProductComparator";
import { PeopleLikeYouRecommendations } from "@/components/PeopleLikeYouRecommendations";
import { UserAttributesForm } from "@/components/UserAttributesForm";
import { CustomerSubscriptionsTable } from "@/components/CustomerSubscriptionsTable";
import { DynamicFormRenderer } from "@/components/DynamicFormRenderer";
import { LoyaltyDashboard } from "@/components/loyalty/LoyaltyDashboard";
import { MissionsList } from "@/components/loyalty/MissionsList";
import { RewardsMarketplace } from "@/components/loyalty/RewardsMarketplace";
import { ReferralProgram } from "@/components/loyalty/ReferralProgram";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";

const B2C = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeSubscribeTab, setActiveSubscribeTab] = useState("compare");
  const [activeMainTab, setActiveMainTab] = useState("dashboard");
  const [selectedFormTemplate, setSelectedFormTemplate] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [loyaltyLevel, setLoyaltyLevel] = useState<string>('bronze');
  const [loading, setLoading] = useState(true);
  
  // Get user role
  const { role } = useUserRole(user);

  // Fetch available form templates for B2C
  const { data: formTemplates } = useQuery({
    queryKey: ['form-templates-b2c'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_deployments')
        .select(`
          id,
          channel,
          form_template_id,
          form_templates (
            id,
            name,
            description,
            category,
            product_type
          )
        `)
        .eq('channel', 'B2C')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });
  
  // Déterminer si l'utilisateur est un customer (B2C uniquement)
  const isCustomerOnly = role === 'customer';

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

        // Fetch loyalty profile
        const { data: loyaltyData, error: loyaltyError } = await supabase
          .from('loyalty_profiles')
          .select('total_points, current_level')
          .eq('user_id', user.id)
          .single();

        if (!loyaltyError && loyaltyData) {
          setLoyaltyPoints(loyaltyData.total_points);
          setLoyaltyLevel(loyaltyData.current_level);
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

          supabase
            .from('loyalty_profiles')
            .select('total_points, current_level')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setLoyaltyPoints(data.total_points);
                setLoyaltyLevel(data.current_level);
              }
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
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => setActiveMainTab("diagnostic")}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Diagnostic IA gratuit
              </Button>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => {
                  // Ouvre le chat omnicanal qui est toujours disponible en bas de page
                  const chatWidget = document.querySelector('[data-chat-widget]');
                  if (chatWidget) {
                    (chatWidget as HTMLElement).click();
                  }
                }}
              >
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
            label="Points de fidélité"
            value={loyaltyPoints.toLocaleString('fr-FR')}
            icon={Trophy}
            trend={`Niveau ${loyaltyLevel.charAt(0).toUpperCase() + loyaltyLevel.slice(1)}`}
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
            label={annualSavings > 0 ? "Économies annuelles" : "Prochain paiement"}
            value={annualSavings > 0 ? `${annualSavings.toLocaleString('fr-FR')} FCFA` : nextPayment.text}
            icon={annualSavings > 0 ? TrendingUp : Clock}
            trend={annualSavings > 0 ? "Multi-polices (-10%)" : subscriptions.some(sub => sub.payment_method) ? `Auto. ${subscriptions.find(sub => sub.payment_method)?.payment_method}` : "À configurer"}
            variant={annualSavings > 0 ? "success" : (nextPayment.days > 0 && nextPayment.days <= 7 ? "warning" : "default")}
          />
        </div>

        {/* Features Tabs */}
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="loyalty"><Trophy className="w-4 h-4 mr-1" />Fidélité</TabsTrigger>
            <TabsTrigger value="loyalty-missions">Missions</TabsTrigger>
            <TabsTrigger value="loyalty-rewards">Récompenses</TabsTrigger>
            <TabsTrigger value="loyalty-referral">Parrainage</TabsTrigger>
            <TabsTrigger value="diagnostic">Diagnostic IA</TabsTrigger>
            <TabsTrigger value="subscribe">Souscrire</TabsTrigger>
            <TabsTrigger value="claim">Sinistre OCR</TabsTrigger>
            <TabsTrigger value="policies">Mes polices</TabsTrigger>
          </TabsList>

          <TabsContent value="loyalty" className="mt-6">
            <LoyaltyDashboard />
          </TabsContent>

          <TabsContent value="loyalty-missions" className="mt-6">
            <MissionsList />
          </TabsContent>

          <TabsContent value="loyalty-rewards" className="mt-6">
            <RewardsMarketplace />
          </TabsContent>

          <TabsContent value="loyalty-referral" className="mt-6">
            <ReferralProgram />
          </TabsContent>

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
            <div className="space-y-6">
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

              {/* Liste des sinistres */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Mes sinistres déclarés</h3>
                {claims.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Aucun sinistre déclaré</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {claims.map((claim) => (
                      <div key={claim.id} className="p-4 border rounded-lg hover:shadow-medium transition-base">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                              <AlertCircle className="w-5 h-5 text-warning" />
                            </div>
                            <div>
                              <p className="font-semibold">{claim.claim_type}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(claim.incident_date || claim.created_at)}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                            {getStatusText(claim.status)}
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4 text-sm mb-3">
                          {claim.cost_estimation && (
                            <div>
                              <p className="text-muted-foreground mb-1">Estimation</p>
                              <p className="font-semibold">{parseFloat(claim.cost_estimation).toLocaleString('fr-FR')} FCFA</p>
                            </div>
                          )}
                          {!isCustomerOnly && claim.ai_confidence && (
                            <div>
                              <p className="text-muted-foreground mb-1">Confiance IA</p>
                              <p className="font-semibold">{Math.round(claim.ai_confidence * 100)}%</p>
                            </div>
                          )}
                          {claim.location && (
                            <div>
                              <p className="text-muted-foreground mb-1">Lieu</p>
                              <p className="font-medium">{claim.location}</p>
                            </div>
                          )}
                        </div>

                        {claim.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {claim.description}
                          </p>
                        )}

                        {claim.damages && Array.isArray(claim.damages) && claim.damages.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Dommages identifiés:</p>
                            <div className="flex flex-wrap gap-2">
                              {claim.damages.slice(0, 3).map((damage: any, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-muted rounded text-xs">
                                  {damage.zone || damage.damageType}
                                </span>
                              ))}
                              {claim.damages.length > 3 && (
                                <span className="px-2 py-1 bg-muted rounded text-xs">
                                  +{claim.damages.length - 3} autres
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-3 border-t">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/b2c/claims/${claim.id}`)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Voir détails
                          </Button>
                          {claim.status === 'Draft' && (
                            <Button variant="outline" size="sm" onClick={() => navigate(`/b2c/claims/${claim.id}/edit`)}>
                              Modifier
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Overview & Quick Actions */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Stats Summary */}
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Résumé de votre protection</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-primary/5 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <span className="font-semibold">Vos polices</span>
                      </div>
                      <p className="text-2xl font-bold mb-1">{activeSubscriptionsCount}</p>
                      <p className="text-sm text-muted-foreground">
                        {activeSubscriptionsCount > 0 ? `${totalMonthlyPremium.toLocaleString('fr-FR')} FCFA/mois` : 'Aucune police active'}
                      </p>
                    </div>
                    <div className="p-4 bg-warning/5 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-warning" />
                        <span className="font-semibold">Sinistres</span>
                      </div>
                      <p className="text-2xl font-bold mb-1">{pendingClaimsCount}</p>
                      <p className="text-sm text-muted-foreground">
                        {pendingClaimsCount > 0 ? 'En cours de traitement' : 'Aucun sinistre en cours'}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Recent Subscriptions */}
                {subscriptions.length > 0 && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Polices actives récentes</h3>
                      <Button variant="ghost" size="sm" onClick={() => setActiveMainTab("policies")}>
                        Voir tout
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {subscriptions.filter(s => s.status === 'active').slice(0, 3).map((sub) => (
                        <div key={sub.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{sub.products?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {parseFloat(sub.monthly_premium).toLocaleString('fr-FR')} FCFA/mois
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-bright-green/10 text-bright-green">
                            Active
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Recent Claims */}
                {claims.length > 0 && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Sinistres récents</h3>
                      <Button variant="ghost" size="sm" onClick={() => setActiveMainTab("claim")}>
                        Voir tout
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {claims.slice(0, 3).map((claim) => (
                        <div key={claim.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-warning" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{claim.claim_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(claim.incident_date || claim.created_at)}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(claim.status)}`}>
                            {getStatusText(claim.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Call to Actions */}
                {subscriptions.length === 0 && (
                  <Card className="p-8 text-center">
                    <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Protégez ce qui compte</h3>
                    <p className="text-muted-foreground mb-6">
                      Découvrez nos offres d'assurance adaptées à vos besoins
                    </p>
                    <Button onClick={() => {
                      setActiveMainTab("subscribe");
                      setActiveSubscribeTab("compare");
                    }}>
                      Découvrir nos offres
                    </Button>
                  </Card>
                )}
              </div>

              {/* Right Column - Recommendations & Support */}
              <div className="space-y-6">
                <UserAttributesForm />
                
                <PeopleLikeYouRecommendations 
                  onSubscribe={(productId) => {
                    supabase
                      .from('products')
                      .select('*')
                      .eq('id', productId)
                      .single()
                      .then(({ data }) => {
                        if (data) {
                          setSelectedProduct(data);
                          setActiveMainTab("subscribe");
                          setActiveSubscribeTab("subscribe");
                        }
                      });
                  }}
                />

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Actions rapides</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/b2c/claims/new')}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Déclarer un sinistre
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveMainTab("policies")}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Mes attestations
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveMainTab("diagnostic")}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Diagnostic IA gratuit
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="policies" className="mt-6">
            <CustomerSubscriptionsTable />
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Omnichannel Chat Widget */}
      <OmnichannelChat />
    </div>
  );
};

export default B2C;
