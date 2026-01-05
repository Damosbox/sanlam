import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Car, Heart, GraduationCap, PiggyBank, Home as HomeIcon, Shield, ArrowRight, Calculator, MessageCircle, FileText, ChevronRight, Users, Clock, Award, MapPin, Phone, Mail } from "lucide-react";
import heroImage from "@/assets/hero-woman.jpg";
import productAutoImg from "@/assets/product-auto.jpg";
import productHabitationImg from "@/assets/product-habitation.jpg";
import productSanteImg from "@/assets/product-sante.jpg";
import productVieImg from "@/assets/product-vie.jpg";
import productEpargneImg from "@/assets/product-epargne.jpg";
import productEducationImg from "@/assets/product-education.jpg";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import AgenciesMap from "@/components/AgenciesMap";

// Images par produit
const productImages: Record<string, string> = {
  "Assurance Auto": productAutoImg,
  "Assurance Habitation": productHabitationImg,
  "Assurance Santé": productSanteImg,
  "Assurance Vie": productVieImg,
  "Épargne Plus": productEpargneImg,
  "Educ'Plus": productEducationImg,
};

const productCards = [
  {
    icon: Car,
    title: "Assurance Auto",
    description: "Roulez en toute confiance",
    href: "/b2c",
    color: "text-primary"
  },
  {
    icon: HomeIcon,
    title: "Assurance Habitation",
    description: "Protégez votre foyer",
    href: "/b2c",
    color: "text-primary"
  },
  {
    icon: Heart,
    title: "Assurance Santé",
    description: "Prenez soin de votre santé",
    href: "/b2c",
    color: "text-primary"
  },
  {
    icon: Shield,
    title: "Assurance Vie",
    description: "Soutenez vos proches",
    href: "/b2c",
    color: "text-primary"
  },
  {
    icon: PiggyBank,
    title: "Épargne Plus",
    description: "Faites fructifier votre épargne",
    href: "/simulateur-epargne",
    color: "text-primary"
  },
  {
    icon: GraduationCap,
    title: "Educ'Plus",
    description: "Préparez l'avenir de vos enfants",
    href: "/simulateur-education",
    color: "text-primary"
  },
];

const quickActions = [
  {
    icon: Calculator,
    title: "Calculer vos besoins",
    description: "Simulez votre couverture idéale",
    href: "/simulateur-epargne"
  },
  {
    icon: MessageCircle,
    title: "Parler à un conseiller",
    description: "Un expert à votre écoute",
    href: "/b2c"
  },
  {
    icon: FileText,
    title: "Faire une soumission",
    description: "Obtenez votre devis en ligne",
    href: "/b2c"
  },
];

const stats = [
  { value: "500K+", label: "Clients protégés", icon: Users },
  { value: "24h", label: "Traitement sinistres", icon: Clock },
  { value: "15+", label: "Années d'expérience", icon: Award },
];

const Home = () => {
  const navigate = useNavigate();
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  
  // Image à afficher selon le produit survolé
  const displayedImage = hoveredProduct ? productImages[hoveredProduct] : heroImage;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section - Blue Background like ia.ca */}
      <section className="relative overflow-hidden gradient-activated py-16 md:py-24">
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left Content - Product Cards */}
            <div className="space-y-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Notre offre en assurance et épargne
              </h1>
              
              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {productCards.map((product) => (
                  <Link
                    key={product.title}
                    to={product.href}
                    onMouseEnter={() => setHoveredProduct(product.title)}
                    onMouseLeave={() => setHoveredProduct(null)}
                    className={cn(
                      "group flex items-center gap-3 p-4 rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-300",
                      hoveredProduct === product.title 
                        ? "bg-white/25 scale-[1.02]" 
                        : "bg-white/10 hover:bg-white/20"
                    )}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                      <product.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm">{product.title}</h3>
                      <p className="text-white/70 text-xs">{product.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Link to="/b2c">
                  <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
                    Voir notre offre complète
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/b2c">
                  <Button className="bg-white text-primary hover:bg-white/90">
                    Parler à un conseiller
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Content - Hero Image with preloading */}
            <div className="relative hidden lg:block">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl w-full max-w-md ml-auto aspect-square">
                {/* Preload all images for instant switching */}
                <div className="hidden">
                  {Object.values(productImages).map((src, idx) => (
                    <img key={idx} src={src} alt="" loading="eager" />
                  ))}
                </div>
                <img 
                  key={displayedImage}
                  src={displayedImage} 
                  alt="Famille protégée par Sanlam Allianz" 
                  loading="eager"
                  decoding="async"
                  width={448}
                  height={448}
                  className="w-full h-full object-cover transition-opacity duration-300 animate-fade-in"
                />
                {/* Overlay avec icône du produit survolé */}
                {hoveredProduct && (
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent flex items-end justify-center pb-8 animate-fade-in">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                      <p className="text-primary font-semibold text-sm">{hoveredProduct}</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[hsl(var(--bright-green))]/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-[hsl(var(--bright-green))]" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">+500 000</p>
                    <p className="text-sm text-muted-foreground">Clients protégés</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compact Client Banner with Stats */}
      <section className="py-8 bg-muted border-b">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left - Client CTA */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <stat.icon className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-lg font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right - Actions */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">Déjà client ?</span>
              <Link to="/auth">
                <Button size="sm">
                  Mon espace
                </Button>
              </Link>
              <Link to="/b2c">
                <Button variant="outline" size="sm">
                  Déclarer un sinistre
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Nos Agences Section */}
      <section className="py-16 bg-muted">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Nos Agences en Côte d'Ivoire
            </h2>
            <p className="text-muted-foreground">
              Retrouvez-nous dans nos différentes agences à Abidjan pour un accompagnement personnalisé.
            </p>
          </div>

          {/* Sièges principaux */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="p-6 rounded-2xl border bg-card hover:shadow-medium transition-all">
              <h3 className="font-bold text-lg text-primary mb-4">SanlamAllianz Vie</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">2 Boulevard Roume, Plateau<br />01 BP 1741 Abidjan 01</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href="tel:+22527202597" className="text-foreground hover:text-primary transition-colors">(+225) 27 20 25 97 00</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href="mailto:saci-infovie@sanlamallianz.com" className="text-foreground hover:text-primary transition-colors text-xs">saci-infovie@sanlamallianz.com</a>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border bg-card hover:shadow-medium transition-all">
              <h3 className="font-bold text-lg text-primary mb-4">SanlamAllianz Non-Vie</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">3 Boulevard Roume, Plateau<br />01 BP 3832 Abidjan 01</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href="tel:+22527202536" className="text-foreground hover:text-primary transition-colors">(+225) 27 20 25 36 00</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href="mailto:saci-infos@sanlamallianz.com" className="text-foreground hover:text-primary transition-colors text-xs">saci-infos@sanlamallianz.com</a>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border bg-card hover:shadow-medium transition-all">
              <h3 className="font-bold text-lg text-primary mb-4">Relation Client</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">3 Boulevard Roume, Plateau<br />01 BP 3832 Abidjan 01</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href="tel:+22527202777" className="text-foreground hover:text-primary transition-colors">(+225) 27 20 27 77 77</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href="mailto:saci-relationclient@sanlamallianz.com" className="text-foreground hover:text-primary transition-colors text-xs">saci-relationclient@sanlamallianz.com</a>
                </div>
              </div>
            </div>
          </div>

          {/* Espaces services */}
          <h3 className="text-xl font-semibold text-foreground mb-6">Espaces Services</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border bg-card hover:shadow-soft transition-all">
              <h4 className="font-semibold text-foreground mb-2">Cocody - 2 Plateaux</h4>
              <p className="text-xs text-muted-foreground mb-2">Boulevard Latrille, voisin Lunetterie Alain Afflelou</p>
              <div className="flex items-center gap-2 text-xs">
                <Phone className="w-3 h-3 text-primary" />
                <span className="text-foreground">07 48 35 44 51</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-card hover:shadow-soft transition-all">
              <h4 className="font-semibold text-foreground mb-2">Cocody - II Plateaux</h4>
              <p className="text-xs text-muted-foreground mb-2">Bd Latrille, face Patisserie Abidjanaise</p>
              <div className="flex items-center gap-2 text-xs">
                <Phone className="w-3 h-3 text-primary" />
                <span className="text-foreground">07 07 93 52 14</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-card hover:shadow-soft transition-all">
              <h4 className="font-semibold text-foreground mb-2">Koumassi</h4>
              <p className="text-xs text-muted-foreground mb-2">Boulevard VGE, Immeuble Privilège 2020</p>
              <div className="flex items-center gap-2 text-xs">
                <Phone className="w-3 h-3 text-primary" />
                <span className="text-foreground">07 07 90 64 80</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-card hover:shadow-soft transition-all">
              <h4 className="font-semibold text-foreground mb-2">Plateau</h4>
              <p className="text-xs text-muted-foreground mb-2">2, Boulevard Roume</p>
              <div className="flex items-center gap-2 text-xs">
                <Phone className="w-3 h-3 text-primary" />
                <span className="text-foreground">27 20 25 36 00</span>
              </div>
            </div>
          </div>

          {/* Carte interactive */}
          <div className="mt-10">
            <h3 className="text-xl font-semibold text-foreground mb-6">Nous trouver</h3>
            <AgenciesMap />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 gradient-activated">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Prêt à être mieux protégé?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Obtenez un devis personnalisé en quelques minutes et découvrez nos offres adaptées à votre situation.
          </p>
          <Link to="/b2c">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              Obtenir mon devis gratuit
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
