import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Heart, Stethoscope, Pill, Hospital, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: Stethoscope, title: "Consultations", description: "Médecins généralistes et spécialistes" },
  { icon: Hospital, title: "Hospitalisation", description: "Prise en charge complète" },
  { icon: Pill, title: "Pharmacie", description: "Remboursement des médicaments" },
  { icon: Heart, title: "Prévention", description: "Bilans de santé offerts" },
];

const guarantees = [
  "Consultations médicales",
  "Hospitalisation chirurgicale",
  "Analyses et examens",
  "Pharmacie",
  "Optique et dentaire",
  "Maternité",
  "Médecine douce",
  "Téléconsultation 24/7",
];

const AssuranceSante = () => {
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
                Assurance Santé
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Prenez soin de votre santé et celle de vos proches
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Une couverture santé complète pour vous et votre famille. Accédez aux meilleurs soins sans vous soucier des frais.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/auth")}>
                  Obtenir un devis gratuit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  Comparer les formules
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop" 
                alt="Famille en bonne santé" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Une couverture santé complète</h2>
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
              <h2 className="text-3xl font-bold mb-6">Nos garanties santé</h2>
              <p className="text-muted-foreground mb-8">
                Des formules adaptées à chaque étape de votre vie : individuel, couple ou famille.
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
              <div className="text-4xl font-bold text-primary mb-2">25 000 FCFA</div>
              <p className="text-muted-foreground mb-6">par mois pour une couverture individuelle</p>
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
          <h2 className="text-3xl font-bold mb-4">Votre santé, notre priorité</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Rejoignez les milliers de familles qui nous font confiance pour leur couverture santé.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
            Obtenir mon devis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AssuranceSante;
