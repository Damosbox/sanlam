import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Heart, Users, TrendingUp, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: Users, title: "Protection famille", description: "Capital versé à vos bénéficiaires" },
  { icon: TrendingUp, title: "Épargne", description: "Faites fructifier votre capital" },
  { icon: Shield, title: "Prévoyance", description: "Couverture décès et invalidité" },
  { icon: Heart, title: "Tranquillité", description: "L'avenir de vos proches assuré" },
];

const guarantees = [
  "Capital décès garanti",
  "Invalidité permanente",
  "Rente éducation",
  "Obsèques",
  "Épargne retraite",
  "Avantages fiscaux",
  "Versements flexibles",
  "Rachat partiel possible",
];

const AssuranceVie = () => {
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
                Assurance Vie
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Protégez l'avenir de ceux que vous aimez
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Constituez un capital pour vos proches et préparez sereinement votre avenir avec nos solutions d'assurance vie.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/auth")}>
                  Obtenir un devis gratuit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/simulateur-epargne")}>
                  Simuler mon épargne
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop" 
                alt="Famille heureuse" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Pourquoi souscrire une assurance vie ?</h2>
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
              <h2 className="text-3xl font-bold mb-6">Nos garanties vie</h2>
              <p className="text-muted-foreground mb-8">
                Des solutions flexibles pour protéger votre famille et préparer votre retraite.
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
              <div className="text-4xl font-bold text-primary mb-2">10 000 FCFA</div>
              <p className="text-muted-foreground mb-6">par mois pour démarrer votre épargne</p>
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
          <h2 className="text-3xl font-bold mb-4">Pensez à demain, agissez aujourd'hui</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Plus vous commencez tôt, plus votre capital sera important. Simulez votre épargne dès maintenant.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/simulateur-epargne")}>
            Simuler mon épargne
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AssuranceVie;
