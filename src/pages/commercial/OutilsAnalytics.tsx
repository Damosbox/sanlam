import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BarChart3, TrendingUp, Target, PieChart, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: BarChart3, title: "Tableau de bord", description: "Visualisez vos KPIs en temps réel" },
  { icon: TrendingUp, title: "Évolution", description: "Suivez votre progression mensuelle" },
  { icon: Target, title: "Objectifs", description: "Définissez et atteignez vos cibles" },
  { icon: PieChart, title: "Répartition", description: "Analysez votre portefeuille produit" },
];

const metrics = [
  "Chiffre d'affaires (GWP)",
  "Nombre de polices vendues",
  "Taux de conversion",
  "Panier moyen",
  "Top produits",
  "Leads par source",
  "Temps de conversion",
  "Commissions générées",
];

const OutilsAnalytics = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                Analytics & Performance
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Pilotez votre activité avec des données
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Des tableaux de bord intuitifs pour suivre votre performance, identifier les opportunités et atteindre vos objectifs.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/auth?broker=true")}>
                  Voir mes stats
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  En savoir plus
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop" 
                alt="Analytics dashboard" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Des insights actionnables</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Métriques suivies</h2>
              <p className="text-muted-foreground mb-8">
                Tous les indicateurs clés pour piloter efficacement votre activité commerciale.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {metrics.map((metric, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{metric}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-background rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Recommandations IA</h3>
              <p className="text-muted-foreground mb-6">
                L'intelligence artificielle analyse vos données et vous suggère des actions pour améliorer vos résultats.
              </p>
              <Button className="w-full" size="lg" onClick={() => navigate("/auth?broker=true")}>
                Découvrir mes recommandations
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prenez des décisions éclairées</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Accédez à vos statistiques et optimisez votre stratégie commerciale.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth?broker=true")}>
            Accéder à mon dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OutilsAnalytics;
