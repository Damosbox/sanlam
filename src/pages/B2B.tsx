import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, DollarSign, Award, Target, Zap } from "lucide-react";

const B2B = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        {/* Welcome Banner */}
        <Card className="p-8 mb-8 gradient-warm text-white">
          <h1 className="text-3xl font-bold mb-2">Espace Courtiers & Agents 🎯</h1>
          <p className="text-white/90 mb-6">Gérez votre portefeuille et maximisez vos commissions</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="lg">
              <Target className="w-4 h-4 mr-2" />
              Nouveau prospect
            </Button>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Award className="w-4 h-4 mr-2" />
              Mes badges
            </Button>
          </div>
        </Card>

        {/* Performance Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            label="Clients actifs"
            value="142"
            icon={Users}
            trend="+18 ce mois"
            variant="success"
          />
          <StatCard
            label="Commissions ce mois"
            value="1.2M FCFA"
            icon={DollarSign}
            trend="+24% vs mois dernier"
            variant="success"
          />
          <StatCard
            label="Taux de conversion"
            value="68%"
            icon={TrendingUp}
            trend="+5 points"
            variant="success"
          />
          <StatCard
            label="Classement régional"
            value="#3"
            icon={Award}
            trend="Top 5%"
            variant="default"
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Clients Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Clients récents</h2>
              <Button variant="outline" size="sm">
                Voir tout
              </Button>
            </div>

            <div className="space-y-4">
              <Card className="p-6 transition-base hover:shadow-medium">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      KD
                    </div>
                    <div>
                      <h3 className="font-semibold">Koffi Diallo</h3>
                      <p className="text-sm text-muted-foreground">Auto + Habitation</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[hsl(var(--bright-green))]">12 500 FCFA</p>
                    <p className="text-xs text-muted-foreground">Commission/mois</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-[hsl(var(--bright-green))]/10 text-[hsl(var(--bright-green))]">
                    Actif
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                    Upsell: +30%
                  </span>
                </div>
              </Card>

              <Card className="p-6 transition-base hover:shadow-medium">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center font-semibold text-accent">
                      AN
                    </div>
                    <div>
                      <h3 className="font-semibold">Aminata N'Diaye</h3>
                      <p className="text-sm text-muted-foreground">Santé Famille</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[hsl(var(--bright-green))]">18 200 FCFA</p>
                    <p className="text-xs text-muted-foreground">Commission/mois</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-[hsl(var(--bright-green))]/10 text-[hsl(var(--bright-green))]">
                    Actif
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))]">
                    Renouvellement: 45j
                  </span>
                </div>
              </Card>
            </div>

            {/* Scoring IA Section */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Scoring IA - Opportunités</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                  <div>
                    <p className="font-medium text-sm">Jean-Paul Mensah</p>
                    <p className="text-xs text-muted-foreground">Renouvellement probable: 92%</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Contacter
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                  <div>
                    <p className="font-medium text-sm">Fatou Camara</p>
                    <p className="text-xs text-muted-foreground">Upsell Auto Premium: 78%</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Proposer
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Gamification & Tools */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-accent/10 to-[hsl(var(--yellow))]/10">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-accent" />
                <h3 className="font-semibold">Club Intermédiaires</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Niveau Argent</span>
                    <span className="text-sm font-semibold">2 850 / 5 000 pts</span>
                  </div>
                  <div className="h-2 rounded-full bg-background overflow-hidden">
                    <div className="h-full bg-gradient-warm w-[57%]" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-background">
                    <p className="text-xl">🏆</p>
                    <p className="text-xs">Top 10</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background">
                    <p className="text-xl">🎯</p>
                    <p className="text-xs">100 ventes</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background">
                    <p className="text-xl">⭐</p>
                    <p className="text-xs">5 étoiles</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Outils rapides</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Target className="w-4 h-4 mr-2" />
                  Pipeline ventes
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Tracking commissions
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Award className="w-4 h-4 mr-2" />
                  Formation continue
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default B2B;
