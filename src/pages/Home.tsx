import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Car, Heart, GraduationCap, Sprout, PiggyBank, Home as HomeIcon, TrendingUp, Shield } from "lucide-react";
import heroImage from "@/assets/hero-woman.jpg";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleSubscribe = (productType: string) => {
    navigate('/b2c', { state: { activeTab: 'subscribe', productType } });
  };

  const handleEpargneClick = () => {
    navigate('/simulateur-epargne');
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
              title="Auto"
              description="Protection complète pour votre véhicule avec des garanties adaptées à vos besoins."
              icon={Car}
              gradient="activated"
              features={[
                "Responsabilité civile",
                "Dommages tous accidents",
                "Vol et incendie",
                "Assistance 24/7"
              ]}
              onSubscribe={() => handleSubscribe('auto')}
            />
            
            <ProductCard
              title="Épargne & Retraite"
              description="Construisez votre capital sereinement et préparez votre avenir avec une épargne flexible et avantageuse."
              icon={PiggyBank}
              gradient="accent"
              features={[
                "Épargne progressive",
                "Retraite complémentaire",
                "Participation aux bénéfices",
                "Rachats flexibles"
              ]}
              onSubscribe={handleEpargneClick}
              customButtonText="Simuler mon capital"
            />
            
            <ProductCard
              title="Santé"
              description="Prenez soin de vous et de vos proches avec une couverture santé optimale."
              icon={Heart}
              gradient="warm"
              features={[
                "Consultations médicales",
                "Hospitalisation",
                "Soins dentaires",
                "Médicaments prescrits"
              ]}
              onSubscribe={() => handleSubscribe('health')}
            />
            
            <ProductCard
              title="Habitation"
              description="Protégez votre foyer contre tous les risques du quotidien."
              icon={HomeIcon}
              gradient="success"
              features={[
                "Dommages électriques",
                "Vol et vandalisme",
                "Catastrophes naturelles",
                "Responsabilité locative"
              ]}
              onSubscribe={() => handleSubscribe('home')}
            />
            
            <ProductCard
              title="Éducation"
              description="Financez sereinement les études de vos enfants avec une rente certaine revalorisable."
              icon={GraduationCap}
              gradient="info"
              features={[
                "Rente éducation garantie",
                "Protection décès & invalidité",
                "Versements périodiques",
                "Rente certaine 5 ans"
              ]}
              onSubscribe={() => handleSubscribe("education")}
            />
            
            <ProductCard
              title="Agricole"
              description="Solutions d'assurance adaptées aux besoins des agriculteurs."
              icon={Sprout}
              gradient="success"
              features={[
                "Protection des récoltes",
                "Matériel agricole",
                "Bétail",
                "Responsabilité exploitation"
              ]}
              onSubscribe={() => handleSubscribe('agriculture')}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
