import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Car, Heart, Smartphone, Sprout, PiggyBank, Home as HomeIcon, TrendingUp, Shield } from "lucide-react";
import heroImage from "@/assets/hero-woman.jpg";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleSubscribe = (productType: string) => {
    navigate('/b2c', { state: { activeTab: 'subscribe', productType } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                L'assurance intelligente
                <span className="text-gradient-activated"> propulsée par l'IA</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Diagnostic personnalisé, souscription en 2 étapes et support omnicanal pour 
                particuliers, courtiers et administrateurs.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--bright-green))]/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[hsl(var(--bright-green))]" />
                  </div>
                  <div>
                    <p className="font-semibold">+45% conversion</p>
                    <p className="text-sm text-muted-foreground">avec l'IA</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">100% sécurisé</p>
                    <p className="text-sm text-muted-foreground">RGPD compliant</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Professionelle utilisant la plateforme Allianz Sanlam"
                className="rounded-3xl shadow-strong w-full"
              />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -top-6 -right-6 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Produits d'assurance */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nos produits d'assurance
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Des solutions adaptées à tous vos besoins de protection
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ProductCard
              title="Assurance Auto"
              description="Protection complète pour votre véhicule avec assistance 24/7 et indemnisation rapide."
              icon={Car}
              gradient="activated"
              features={[
                "Responsabilité civile",
                "Tous risques disponible",
                "Assistance dépannage 24/7",
                "Indemnisation sous 48h"
              ]}
              onSubscribe={() => handleSubscribe('auto')}
            />

            <ProductCard
              title="Assurance Santé"
              description="Couverture médicale complète pour vous et votre famille avec accès au réseau de soins."
              icon={Heart}
              gradient="warm"
              features={[
                "Consultation & hospitalisation",
                "Médicaments remboursés",
                "Réseau de soins agréés",
                "Téléconsultation incluse"
              ]}
              onSubscribe={() => handleSubscribe('sante')}
            />

            <ProductCard
              title="Assurance Habitation"
              description="Protégez votre logement contre les risques d'incendie, vol et dégâts des eaux."
              icon={HomeIcon}
              gradient="success"
              features={[
                "Incendie & dégâts des eaux",
                "Vol & vandalisme",
                "Responsabilité civile",
                "Assistance serrurerie"
              ]}
              onSubscribe={() => handleSubscribe('habitation')}
            />

            <ProductCard
              title="Assurance Électronique"
              description="Protégez vos appareils électroniques contre le vol, la casse et les pannes."
              icon={Smartphone}
              gradient="info"
              features={[
                "Smartphones & tablettes",
                "Ordinateurs & TV",
                "Vol & casse accidentelle",
                "Remplacement rapide"
              ]}
              onSubscribe={() => handleSubscribe('electronique')}
            />

            <ProductCard
              title="Assurance Agricole"
              description="Solutions adaptées aux exploitants agricoles pour protéger récoltes et équipements."
              icon={Sprout}
              gradient="success"
              features={[
                "Protection des récoltes",
                "Équipements & machines",
                "Bétail & cheptel",
                "Catastrophes naturelles"
              ]}
              onSubscribe={() => handleSubscribe('agricole')}
            />

            <ProductCard
              title="Épargne & Retraite"
              description="Constituez votre épargne et préparez votre retraite avec des solutions avantageuses."
              icon={PiggyBank}
              gradient="accent"
              features={[
                "Épargne progressive",
                "Rendement attractif",
                "Retraite complémentaire",
                "Avantages fiscaux"
              ]}
              onSubscribe={() => handleSubscribe('epargne')}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
