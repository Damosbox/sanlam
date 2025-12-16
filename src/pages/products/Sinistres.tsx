import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FileText, Phone, Clock, CheckCircle, Camera, MessageSquare, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = [
  { icon: Phone, title: "1. Contactez-nous", description: "Appelez-nous ou déclarez en ligne 24h/24" },
  { icon: Camera, title: "2. Documentez", description: "Prenez des photos et rassemblez les justificatifs" },
  { icon: FileText, title: "3. Déclarez", description: "Remplissez le formulaire de déclaration" },
  { icon: CheckCircle, title: "4. Indemnisation", description: "Recevez votre indemnisation rapidement" },
];

const claimTypes = [
  { title: "Sinistre Auto", description: "Accident, vol, bris de glace, vandalisme" },
  { title: "Sinistre Habitation", description: "Dégât des eaux, incendie, cambriolage" },
  { title: "Sinistre Santé", description: "Remboursement de soins, hospitalisation" },
  { title: "Sinistre Vie", description: "Décès, invalidité, incapacité" },
];

const Sinistres = () => {
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
                Déclaration de sinistre
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Un sinistre ? Nous sommes là pour vous accompagner
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Déclarez votre sinistre en quelques clics et bénéficiez d'un suivi personnalisé jusqu'à votre indemnisation.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/auth")}>
                  Déclarer un sinistre
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  <Phone className="mr-2 h-5 w-5" />
                  Appeler le +225 27 20 25 25 25
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop" 
                alt="Assistance sinistre" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow relative">
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

      {/* Claim Types Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Types de sinistres</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {claimTypes.map((type, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/auth")}>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{type.title}</h3>
                  <p className="text-muted-foreground mb-4">{type.description}</p>
                  <Button variant="link" className="p-0">
                    Déclarer ce sinistre
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold mb-6">Besoin d'aide ?</h2>
              <p className="text-muted-foreground mb-8">
                Notre équipe d'experts est disponible 24h/24 et 7j/7 pour vous accompagner dans vos démarches.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Par téléphone</div>
                    <div className="text-muted-foreground">+225 27 20 25 25 25</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Par WhatsApp</div>
                    <div className="text-muted-foreground">+225 07 07 07 07 07</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Disponibilité</div>
                    <div className="text-muted-foreground">24h/24 - 7j/7</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-background rounded-2xl p-8 shadow-lg border">
              <h3 className="text-2xl font-bold mb-4">Déclarez en ligne</h3>
              <p className="text-muted-foreground mb-6">
                Connectez-vous à votre espace client pour déclarer votre sinistre et suivre son traitement en temps réel.
              </p>
              <Button className="w-full" size="lg" onClick={() => navigate("/auth")}>
                Accéder à mon espace
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Sinistres;
