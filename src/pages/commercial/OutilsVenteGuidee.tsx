import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Target, FileText, Calculator, CheckSquare, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = [
  { icon: Target, title: "1. Identification", description: "Identifiez votre prospect et ses besoins" },
  { icon: Calculator, title: "2. Analyse besoins", description: "Questionnaire intelligent adaptatif" },
  { icon: FileText, title: "3. Devis personnalisé", description: "Génération automatique du devis" },
  { icon: CheckSquare, title: "4. Souscription", description: "Signature électronique et émission" },
];

const benefits = [
  "Parcours en 6 étapes optimisées",
  "Calcul de prime en temps réel",
  "Vérification underwriting automatique",
  "Recommandations IA personnalisées",
  "Documents générés automatiquement",
  "Signature électronique intégrée",
  "Conformité CIMA garantie",
  "Historique des devis sauvegardé",
];

const OutilsVenteGuidee = () => {
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
                Vente Guidée
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Du prospect à la police en 6 étapes
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Un processus de vente structuré qui vous guide à chaque étape pour maximiser vos conversions et garantir la conformité.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/auth?broker=true")}>
                  Accéder à mon espace
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  Voir le parcours
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop" 
                alt="Vente guidée" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Un parcours optimisé</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
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
              <h2 className="text-3xl font-bold mb-6">Vendez plus efficacement</h2>
              <p className="text-muted-foreground mb-8">
                La vente guidée simplifie votre quotidien et améliore l'expérience client.
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
              <h3 className="text-2xl font-bold mb-4">Temps moyen de vente</h3>
              <div className="text-4xl font-bold text-primary mb-2">15 min</div>
              <p className="text-muted-foreground mb-6">de l'identification à l'émission</p>
              <Button className="w-full" size="lg" onClick={() => navigate("/auth?broker=true")}>
                Essayer maintenant
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Simplifiez votre processus de vente</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Concentrez-vous sur le conseil client, nous nous occupons du reste.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth?broker=true")}>
            Commencer une vente
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OutilsVenteGuidee;
