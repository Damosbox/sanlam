import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Users, Filter, Bell, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: Users, title: "Gestion centralisée", description: "Tous vos prospects et clients en un seul endroit" },
  { icon: Filter, title: "Filtres intelligents", description: "Segmentez par statut, produit, date" },
  { icon: Bell, title: "Rappels automatiques", description: "Ne manquez aucune relance" },
  { icon: TrendingUp, title: "Suivi performance", description: "Visualisez votre taux de conversion" },
];

const benefits = [
  "Vue kanban des leads par statut",
  "Historique complet des interactions",
  "Notes et commentaires partagés",
  "Assignation automatique des leads",
  "Export CSV et Excel",
  "Recherche avancée",
  "Intégration WhatsApp",
  "Notifications temps réel",
];

const OutilsPipeline = () => {
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
                Pipeline Leads Intelligent
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Gérez vos prospects comme un pro
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Un CRM simplifié conçu pour les commerciaux d'assurance. Suivez chaque prospect de la première prise de contact jusqu'à la signature.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/auth?broker=true")}>
                  Accéder à mon espace
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  Voir une démo
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop" 
                alt="Pipeline CRM" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Fonctionnalités clés</h2>
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

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Tout ce dont vous avez besoin</h2>
              <p className="text-muted-foreground mb-8">
                Un outil complet pour optimiser votre prospection et maximiser vos conversions.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-background rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Augmentez vos ventes</h3>
              <div className="text-4xl font-bold text-primary mb-2">+35%</div>
              <p className="text-muted-foreground mb-6">de taux de conversion en moyenne</p>
              <Button className="w-full" size="lg" onClick={() => navigate("/auth?broker=true")}>
                Commencer maintenant
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à booster votre productivité ?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Rejoignez les commerciaux Sanlam Allianz qui utilisent déjà notre plateforme.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth?broker=true")}>
            Accéder à mon espace
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OutilsPipeline;
