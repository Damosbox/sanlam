import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Car, Heart, GraduationCap, Sprout, PiggyBank, Home as HomeIcon, TrendingUp, Shield } from "lucide-react";
import heroImage from "@/assets/hero-woman.jpg";
import { useNavigate } from "react-router-dom";
const Home = () => {
  const navigate = useNavigate();
  const handleSubscribe = (productType: string) => {
    navigate('/b2c', {
      state: {
        activeTab: 'subscribe',
        productType
      }
    });
  };
  const handleEpargneClick = () => {
    navigate('/simulateur-epargne');
  };
  const handleEducationClick = () => {
    navigate('/simulateur-education');
  };
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                L'assurance intelligente
                <span className="text-gradient-activated"> qui vous accompagne</span>
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
              <img src={heroImage} alt="Professionelle utilisant la plateforme Allianz Sanlam" className="rounded-3xl shadow-strong w-full" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -top-6 -right-6 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Communication Block */}
      <section className="py-12 bg-muted">
        <div className="container">
          <div className="text-center text-foreground space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">
              Découvrez nos offres exclusives
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Bénéficiez de tarifs préférentiels et d'un accompagnement personnalisé pour tous vos projets d'assurance.
            </p>
          </div>
        </div>
      </section>

      {/* Produits d'assurance */}
      
    </div>;
};
export default Home;