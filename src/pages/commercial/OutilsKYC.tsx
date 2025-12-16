import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShieldCheck, FileSearch, UserCheck, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: UserCheck, title: "Vérification identité", description: "OCR automatique des pièces d'identité" },
  { icon: FileSearch, title: "Contrôle documents", description: "Validation des justificatifs" },
  { icon: ShieldCheck, title: "Conformité LCB-FT", description: "Respect des obligations réglementaires" },
  { icon: AlertTriangle, title: "Détection PPE", description: "Identification des personnes exposées" },
];

const compliance = [
  "Extraction OCR automatique",
  "Vérification PPE (Personnes Politiquement Exposées)",
  "Contrôle LCB-FT",
  "Validation des documents",
  "Historique des vérifications",
  "Alertes de conformité",
  "Rapport d'audit complet",
  "Archivage sécurisé",
];

const OutilsKYC = () => {
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
                Compliance KYC
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Conformité simplifiée, risques maîtrisés
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Automatisez vos contrôles de conformité KYC et LCB-FT. Protégez votre activité tout en accélérant l'onboarding client.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/auth?broker=true")}>
                  Accéder à mon espace
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  En savoir plus
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop" 
                alt="Compliance KYC" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Fonctionnalités de conformité</h2>
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

      {/* Compliance Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Contrôles automatisés</h2>
              <p className="text-muted-foreground mb-8">
                Gagnez du temps avec des vérifications automatiques tout en restant conforme aux réglementations CIMA.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {compliance.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-background rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Réduction du risque</h3>
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <p className="text-muted-foreground mb-6">de détection des anomalies</p>
              <Button className="w-full" size="lg" onClick={() => navigate("/auth?broker=true")}>
                Gérer ma conformité
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Sécurisez votre activité</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            La conformité n'a jamais été aussi simple. Protégez-vous et protégez vos clients.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth?broker=true")}>
            Commencer maintenant
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OutilsKYC;
