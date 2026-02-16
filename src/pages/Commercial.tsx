import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Zap, Bell, FileCheck, Eye, BarChart3, Award, Lightbulb, CheckCircle, Users, BookOpen, Handshake, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
import HeroCarousel from "@/components/broker-landing/HeroCarousel";

const features = [
  {
    icon: Target,
    title: "Prospecter efficacement",
    description: "Identifiez, suivez et priorisez vos opportunités commerciales depuis un seul espace.",
  },
  {
    icon: Zap,
    title: "Vendre simplement",
    description: "Accédez à des parcours de vente guidés et générez vos devis en quelques étapes.",
  },
  {
    icon: Bell,
    title: "Agir au bon moment",
    description: "Recevez des recommandations intelligentes basées sur votre activité et vos priorités.",
  },
  {
    icon: FileCheck,
    title: "Rester conforme sans effort",
    description: "Centralisez vos documents et automatisez les contrôles réglementaires en toute sécurité.",
  },
];

const piliers = [
  {
    icon: Handshake,
    title: "Accompagnement et proximité",
    description: "Un suivi structuré et une relation de proximité pour vous accompagner dans le développement de votre activité.",
  },
  {
    icon: Lightbulb,
    title: "Outils digitaux performants",
    description: "Des solutions digitales modernes intégrées pour simplifier votre quotidien professionnel.",
  },
  {
    icon: BookOpen,
    title: "Formation et montée en compétences",
    description: "Des dispositifs d'accompagnement et de formation pour renforcer vos performances dans la durée.",
  },
  {
    icon: Users,
    title: "Communauté d'intermédiaires",
    description: "Rejoignez un réseau actif d'intermédiaires partageant les mêmes ambitions et exigences de qualité.",
  },
];

const Commercial = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Promesse globale */}
      <section className="py-16 bg-background">
        <div className="container text-center max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Un espace unique pour simplifier votre quotidien
          </h2>
          <p className="text-muted-foreground text-lg">
            Cette plateforme a été conçue pour vous faire gagner du temps, structurer votre activité et faciliter vos interactions avec SanlamAllianz, dans un environnement simple, sécurisé et évolutif.
          </p>
        </div>
      </section>

      {/* Fonctionnalités clés */}
      <section className="py-16 bg-muted">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Tous les outils essentiels, réunis en un seul espace
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Prospectez, vendez, suivez vos performances et interagissez avec SanlamAllianz à partir d'une plateforme pensée pour votre efficacité au quotidien.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border bg-card hover:shadow-medium hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  <feature.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pilotage et performance */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Enfin une vision claire de votre activité
              </h2>
              <p className="text-muted-foreground">
                Suivez vos indicateurs clés, recevez des alertes utiles et prenez les bonnes décisions, sans multiplier les outils.
              </p>
              <ul className="space-y-3">
                {[
                  "Vue globale de l'activité",
                  "Alertes et rappels automatiques",
                  "Suivi simplifié des opérations",
                  "Reporting accessible",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--bright-green))]" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-xl border">
                <img src={dashboardPreview} alt="Dashboard Preview" className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valeur SanlamAllianz - 4 piliers */}
      <section className="py-16 bg-muted">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Plus qu'une plateforme, un partenariat durable
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Avec SanlamAllianz, vous bénéficiez d'un accompagnement structuré, d'outils performants et de la solidité d'un groupe engagé aux côtés de ses intermédiaires.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {piliers.map((pilier) => (
              <div
                key={pilier.title}
                className="p-6 rounded-2xl border bg-card hover:shadow-medium transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <pilier.icon className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{pilier.title}</h3>
                <p className="text-sm text-muted-foreground">{pilier.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Innovation et projection */}
      <section className="py-16 bg-background">
        <div className="container text-center max-w-3xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Rocket className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Un écosystème moderne, évolutif et intelligent
          </h2>
          <p className="text-muted-foreground text-lg">
            La plateforme évolue continuellement pour intégrer des services intelligents capables d'anticiper vos besoins, de suggérer des actions utiles et de simplifier davantage votre quotidien professionnel.
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 gradient-activated">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Connectez-vous pour accéder à l'ensemble des services et outils mis à votre disposition.
          </h2>
          <div className="mt-8">
            <Link to="/auth/partner">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Se connecter à mon espace
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Commercial;
