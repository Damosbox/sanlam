import { Button } from "@/components/ui/button";
import { ArrowRight, Users, TrendingUp, Award, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "Courtiers partenaires", value: "500+", icon: Users },
  { label: "Taux de conversion moyen", value: "34%", icon: TrendingUp },
  { label: "Commission moyenne", value: "18%", icon: Award },
  { label: "Satisfaction client", value: "4.8/5", icon: Shield },
];

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 lg:py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/pattern-circles.jpg')] opacity-5" />
      
      <div className="container relative">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Shield className="h-4 w-4" />
              Programme Partenaire Sanlam Allianz
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Développez votre{" "}
              <span className="text-gradient-activated">activité courtage</span>{" "}
              avec l'IA
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl">
              Rejoignez le réseau de courtiers Sanlam Allianz et accédez à une plateforme 
              intelligente qui automatise la prospection, optimise vos ventes et maximise 
              vos commissions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2 shadow-lg" asChild>
                <a href="#inscription">
                  Devenir partenaire
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth?broker=true">
                  Accès espace courtier
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Right Stats Grid */}
          <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "150ms" }}>
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="absolute top-0 right-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-primary/10 transition-transform group-hover:scale-150" />
                <stat.icon className="h-8 w-8 text-primary mb-3 relative z-10" />
                <p className="text-3xl font-bold text-foreground relative z-10">{stat.value}</p>
                <p className="text-sm text-muted-foreground relative z-10">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
