import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  Car, 
  Building2, 
  Users, 
  Shield, 
  ArrowRight, 
  Calculator, 
  MessageCircle, 
  FileText, 
  ChevronRight, 
  Briefcase,
  Factory,
  Truck,
  HardHat,
  Scale,
  HeartPulse,
  TrendingUp,
  Clock,
  Award,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const productCards = [
  {
    icon: Truck,
    title: "Flotte Automobile",
    description: "Protégez tous vos véhicules professionnels",
    href: "/b2c",
  },
  {
    icon: Building2,
    title: "Multirisque Pro",
    description: "Locaux, stocks et équipements",
    href: "/b2c",
  },
  {
    icon: Scale,
    title: "Responsabilité Civile",
    description: "RC Pro et exploitation",
    href: "/b2c",
  },
  {
    icon: HeartPulse,
    title: "Santé Collective",
    description: "Couverture santé pour vos équipes",
    href: "/b2c",
  },
  {
    icon: HardHat,
    title: "Accidents du Travail",
    description: "Protection de vos collaborateurs",
    href: "/b2c",
  },
  {
    icon: Briefcase,
    title: "Homme Clé",
    description: "Sécurisez votre capital humain",
    href: "/b2c",
  },
];

const quickActions = [
  {
    icon: Calculator,
    title: "Demander un audit",
    description: "Analyse de vos risques professionnels",
    href: "/b2c"
  },
  {
    icon: MessageCircle,
    title: "Contacter un expert",
    description: "Un conseiller dédié aux entreprises",
    href: "/b2c"
  },
  {
    icon: FileText,
    title: "Obtenir un devis",
    description: "Tarification personnalisée",
    href: "/b2c"
  },
];

const sectors = [
  { name: "BTP & Construction", icon: HardHat },
  { name: "Transport & Logistique", icon: Truck },
  { name: "Commerce & Distribution", icon: Building2 },
  { name: "Industrie", icon: Factory },
  { name: "Services", icon: Briefcase },
  { name: "Santé & Médical", icon: HeartPulse },
];

const stats = [
  { value: "10K+", label: "Entreprises clientes", icon: Building2 },
  { value: "48h", label: "Délai de traitement", icon: Clock },
  { value: "98%", label: "Taux de satisfaction", icon: Award },
];

const advantages = [
  "Tarifs négociés pour les groupements",
  "Gestionnaire de compte dédié",
  "Plateforme de gestion en ligne",
  "Reporting personnalisé",
  "Formation prévention incluse",
  "Assistance 24/7 multilingue",
];

const Commercial = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section - Gradient Background */}
      <section className="relative overflow-hidden gradient-activated py-16 md:py-24">
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left Content - Product Cards */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-sm">
                <Briefcase className="w-4 h-4" />
                Solutions Entreprises
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Assurances professionnelles sur mesure
              </h1>
              
              <p className="text-white/80 text-lg max-w-xl">
                Des solutions adaptées à chaque secteur d'activité pour protéger votre entreprise, vos collaborateurs et votre patrimoine.
              </p>
              
              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {productCards.map((product) => (
                  <Link
                    key={product.title}
                    to={product.href}
                    className="group flex items-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
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
                    Découvrir nos solutions
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/b2c">
                  <Button className="bg-white text-primary hover:bg-white/90">
                    Demander un rendez-vous
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Content - Stats & Trust */}
            <div className="hidden lg:block space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                    <stat.icon className="w-6 h-6 text-white/80 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/70">{stat.label}</p>
                  </div>
                ))}
              </div>
              
              {/* Advantages List */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="font-semibold text-white mb-4">Vos avantages exclusifs</h3>
                <ul className="space-y-2">
                  {advantages.map((advantage) => (
                    <li key={advantage} className="flex items-center gap-2 text-white/80 text-sm">
                      <CheckCircle className="w-4 h-4 text-[hsl(var(--bright-green))]" />
                      {advantage}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
            Comment pouvons-nous vous aider?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.href}
                className="group flex items-center gap-4 p-5 rounded-xl border bg-card hover:shadow-medium hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <action.icon className="w-6 h-6 text-primary group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors Section */}
      <section className="py-16 bg-muted">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Des solutions par secteur d'activité
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Nous connaissons les risques spécifiques de votre métier et proposons des garanties adaptées.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {sectors.map((sector) => (
              <Link
                key={sector.name}
                to="/b2c"
                className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-background border hover:shadow-medium hover:border-primary/20 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <sector.icon className="w-7 h-7 text-primary group-hover:text-white" />
                </div>
                <span className="text-sm font-medium text-foreground text-center">{sector.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Already Client Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Vous êtes déjà client entreprise?
              </h2>
              <p className="text-muted-foreground mb-6">
                Accédez à votre espace pro pour gérer vos contrats, déclarer un sinistre, télécharger vos attestations ou contacter votre gestionnaire.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/auth">
                  <Button>
                    Espace client entreprise
                  </Button>
                </Link>
                <Link to="/b2c">
                  <Button variant="outline">
                    Déclarer un sinistre
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted">
                <FileText className="w-8 h-8 text-primary mb-2" />
                <p className="font-semibold text-foreground">Attestations</p>
                <p className="text-xs text-muted-foreground">Téléchargement immédiat</p>
              </div>
              <div className="p-4 rounded-xl bg-muted">
                <TrendingUp className="w-8 h-8 text-primary mb-2" />
                <p className="font-semibold text-foreground">Reporting</p>
                <p className="text-xs text-muted-foreground">Tableaux de bord</p>
              </div>
              <div className="p-4 rounded-xl bg-muted">
                <Users className="w-8 h-8 text-primary mb-2" />
                <p className="font-semibold text-foreground">Gestion RH</p>
                <p className="text-xs text-muted-foreground">Affiliations en ligne</p>
              </div>
              <div className="p-4 rounded-xl bg-muted">
                <Shield className="w-8 h-8 text-primary mb-2" />
                <p className="font-semibold text-foreground">Sinistres</p>
                <p className="text-xs text-muted-foreground">Suivi en temps réel</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-muted">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Pourquoi les entreprises nous font confiance?
            </h2>
            <p className="text-muted-foreground">
              Plus de 10 000 entreprises en Afrique de l'Ouest nous font confiance pour protéger leur activité.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border bg-card hover:shadow-medium transition-all">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Accompagnement dédié</h3>
              <p className="text-muted-foreground text-sm">
                Un gestionnaire de compte unique pour piloter l'ensemble de vos contrats et répondre à vos besoins.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl border bg-card hover:shadow-medium transition-all">
              <div className="w-14 h-14 rounded-xl bg-[hsl(var(--bright-green))]/10 flex items-center justify-center mb-4">
                <Scale className="w-7 h-7 text-[hsl(var(--bright-green))]" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Expertise sectorielle</h3>
              <p className="text-muted-foreground text-sm">
                Des équipes spécialisées par secteur d'activité pour des garanties parfaitement adaptées à vos risques.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl border bg-card hover:shadow-medium transition-all">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Outils digitaux</h3>
              <p className="text-muted-foreground text-sm">
                Une plateforme complète pour gérer vos contrats, affiliations et sinistres en toute autonomie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 gradient-activated">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Protégez votre entreprise dès maintenant
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Nos experts sont à votre disposition pour analyser vos besoins et vous proposer une solution sur mesure.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/b2c">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Demander un devis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <MessageCircle className="w-5 h-5 mr-2" />
              Être rappelé
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Commercial;
