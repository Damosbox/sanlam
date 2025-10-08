import { Header } from "@/components/Header";
import { PortalCard } from "@/components/PortalCard";
import { Users, Briefcase, Shield, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-woman.jpg";

const Home = () => {
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

      {/* Portal Selection */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choisissez votre portail
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Trois interfaces dédiées pour une expérience optimale selon votre profil
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <PortalCard
              title="Espace Assurés"
              description="Interface B2C pour gérer vos polices, déclarer des sinistres et bénéficier de recommandations IA personnalisées."
              icon={Users}
              href="/b2c"
              gradient="activated"
              features={[
                "Diagnostic IA en 2 minutes",
                "Souscription simplifiée",
                "Gestion des polices et sinistres",
                "Support omnicanal 24/7"
              ]}
            />

            <PortalCard
              title="Espace Courtiers"
              description="Plateforme B2B pour gérer votre portefeuille clients, vos commissions et votre formation continue."
              icon={Briefcase}
              href="/b2b"
              gradient="warm"
              features={[
                "Vue 360° clients",
                "Scoring IA et upsell",
                "Suivi commissions temps réel",
                "Gamification et incentives"
              ]}
            />

            <PortalCard
              title="Espace Admin"
              description="Interface de supervision IA, conformité RGPD, NPS et configuration des produits et APIs."
              icon={Shield}
              href="/admin"
              gradient="success"
              features={[
                "Supervision IA et drift",
                "Dashboard NPS et conformité",
                "Configuration produits",
                "Gestion APIs et marketplace"
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
