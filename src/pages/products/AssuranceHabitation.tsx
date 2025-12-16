import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Home, Shield, Zap, Droplets, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: Home, title: "Protection complète", description: "Votre logement et vos biens protégés" },
  { icon: Shield, title: "Responsabilité civile", description: "Couverture des dommages aux tiers" },
  { icon: Zap, title: "Dommages électriques", description: "Appareils électroniques couverts" },
  { icon: Droplets, title: "Dégâts des eaux", description: "Intervention rapide garantie" },
];

const guarantees = [
  "Incendie et explosion",
  "Dégâts des eaux",
  "Vol et vandalisme",
  "Catastrophes naturelles",
  "Bris de glace",
  "Responsabilité civile",
  "Protection juridique",
  "Assistance 24/7",
];

const AssuranceHabitation = () => {
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
                Assurance Habitation
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Votre foyer mérite la meilleure protection
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Protégez votre maison, votre appartement et tous vos biens avec une assurance habitation adaptée à vos besoins.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/auth")}>
                  Obtenir un devis gratuit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  En savoir plus
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop" 
                alt="Maison protégée" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Une protection sur mesure</h2>
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

      {/* Guarantees Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Garanties incluses</h2>
              <p className="text-muted-foreground mb-8">
                Que vous soyez propriétaire ou locataire, nos formules s'adaptent à votre situation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {guarantees.map((guarantee, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{guarantee}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-background rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-4">À partir de</h3>
              <div className="text-4xl font-bold text-primary mb-2">8 000 FCFA</div>
              <p className="text-muted-foreground mb-6">par mois pour un appartement</p>
              <Button className="w-full" size="lg" onClick={() => navigate("/auth")}>
                Souscrire maintenant
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Protégez ce qui compte le plus</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Obtenez votre devis personnalisé et bénéficiez d'une couverture adaptée à votre logement.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
            Demander un devis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AssuranceHabitation;
