import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  ChevronRight, 
  Briefcase,
  Users,
  Target,
  TrendingUp,
  Award,
  Zap,
  BarChart3,
  Shield,
  FileCheck,
  Headphones,
  CheckCircle,
  Play,
  Star,
  Rocket
} from "lucide-react";
import { Link } from "react-router-dom";
import sanlamLogo from "@/assets/logo_sanlam.svg";
import dashboardPreview from "@/assets/dashboard-preview.jpg";

const features = [
  {
    icon: Target,
    title: "Pipeline Leads Intelligent",
    description: "Gérez vos prospects avec un CRM intégré et des relances automatisées.",
  },
  {
    icon: Zap,
    title: "Vente Guidée 6 Étapes",
    description: "Processus de vente structuré avec calcul de prime en temps réel.",
  },
  {
    icon: BarChart3,
    title: "Recommandations IA",
    description: "L'IA analyse votre portefeuille et suggère des actions commerciales.",
  },
  {
    icon: FileCheck,
    title: "KYC & Compliance",
    description: "Collecte et vérification des documents réglementaires intégrées.",
  },
];

const stats = [
  { value: "500+", label: "Commerciaux actifs" },
  { value: "+35%", label: "Productivité moyenne" },
  { value: "2.5x", label: "Taux de conversion" },
  { value: "24/7", label: "Support disponible" },
];

const benefits = [
  "Accès à tous les produits Sanlam Allianz",
  "Formation continue et certification",
  "Commissions attractives et transparentes",
  "Outils digitaux premium inclus",
  "Support dédié et réactif",
  "Communauté de commerciaux active",
];

const testimonials = [
  {
    name: "Amadou Diallo",
    role: "Commercial Senior",
    region: "Dakar",
    quote: "Grâce à la plateforme, j'ai doublé mon portefeuille clients en 6 mois. L'IA me suggère les meilleures opportunités.",
    rating: 5,
  },
  {
    name: "Fatou Sow",
    role: "Responsable Commerciale",
    region: "Abidjan",
    quote: "Le processus de vente guidée m'a permis de réduire mon temps de souscription de 50%. Mes clients adorent la rapidité.",
    rating: 5,
  },
  {
    name: "Ibrahima Ndiaye",
    role: "Commercial",
    region: "Saint-Louis",
    quote: "Je n'ai plus besoin de papier. Tout est digitalisé, de la prospection à l'émission de la police.",
    rating: 5,
  },
];

const Commercial = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-activated py-16 md:py-24">
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium">
                <Rocket className="w-4 h-4" />
                Espace Commercial Sanlam Allianz
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Développez votre activité avec les meilleurs outils
              </h1>
              
              <p className="text-white/80 text-lg max-w-xl">
                Rejoignez le réseau commercial Sanlam Allianz et accédez à une plateforme complète pour prospecter, vendre et fidéliser vos clients.
              </p>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 py-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/70">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link to="/auth?broker=true">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                    Accéder à mon espace
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="#demo">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    <Play className="w-5 h-5 mr-2" />
                    Voir la démo
                  </Button>
                </Link>
              </div>

              {/* Demo Access */}
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <p className="text-white/80 text-sm mb-2">🔐 Accès démo disponible</p>
                <p className="text-white text-xs">
                  Email: <span className="font-mono">b2btest@box.africa</span> | 
                  Mot de passe: <span className="font-mono">123456</span>
                </p>
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                <img 
                  src={dashboardPreview} 
                  alt="Dashboard Commercial" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[hsl(var(--bright-green))]/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-[hsl(var(--bright-green))]" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">+35%</p>
                    <p className="text-xs text-muted-foreground">Productivité</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Une plateforme complète pour performer
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tous les outils dont vous avez besoin pour développer votre portefeuille clients et maximiser vos revenus.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border bg-card hover:shadow-medium hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  <feature.icon className="w-6 h-6 text-primary group-hover:text-white" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="demo" className="py-16 bg-muted">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Un dashboard pensé pour la performance
              </h2>
              <p className="text-muted-foreground">
                Visualisez vos KPIs, suivez vos leads, gérez vos clients et recevez des recommandations IA personnalisées. Tout en un seul endroit.
              </p>
              
              <ul className="space-y-3">
                {[
                  "Vue 360° de votre activité commerciale",
                  "Alertes et rappels automatisés",
                  "Calcul de prime instantané",
                  "Signature électronique intégrée",
                  "Reporting et analytics avancés",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--bright-green))]" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Link to="/auth?broker=true">
                <Button size="lg">
                  Essayer gratuitement
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-xl border">
                <img 
                  src={dashboardPreview} 
                  alt="Dashboard Preview" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={benefit} className="flex items-start gap-3 p-4 rounded-xl bg-muted">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Pourquoi rejoindre le réseau Sanlam Allianz?
              </h2>
              <p className="text-muted-foreground">
                En tant que commercial Sanlam Allianz, vous bénéficiez d'un accompagnement complet et d'outils de pointe pour réussir dans l'assurance.
              </p>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <Award className="w-10 h-10 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Leader en Afrique de l'Ouest</p>
                  <p className="text-sm text-muted-foreground">35+ années d'expertise et de confiance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-muted">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ce que disent nos commerciaux
            </h2>
            <p className="text-muted-foreground">
              Découvrez les témoignages de ceux qui utilisent la plateforme au quotidien.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="p-6 rounded-2xl bg-background border hover:shadow-medium transition-all">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role} • {testimonial.region}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 gradient-activated">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Prêt à booster votre carrière commerciale?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Rejoignez le réseau Sanlam Allianz et accédez à tous les outils pour réussir dans l'assurance.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/auth?broker=true">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Commencer maintenant
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Headphones className="w-5 h-5 mr-2" />
              Nous contacter
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Commercial;