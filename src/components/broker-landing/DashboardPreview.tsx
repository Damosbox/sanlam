import { Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import dashboardPreview from "@/assets/dashboard-preview.jpg";

const highlights = [
  "Vue 360° de votre portefeuille",
  "KPIs en temps réel",
  "Actions prioritaires du jour",
  "Pipeline leads visuel",
  "Recommandations IA personnalisées",
];

export const DashboardPreview = () => {
  return (
    <section className="py-20 lg:py-28 overflow-hidden">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Un dashboard pensé pour{" "}
              <span className="text-primary">l'action</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Dès votre connexion, visualisez l'essentiel : leads à traiter, 
              relances du jour, commissions en cours. Chaque élément est cliquable 
              pour une action immédiate.
            </p>
            
            <ul className="space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            
            <Button size="lg" variant="outline" className="gap-2">
              <Play className="h-4 w-4" />
              Voir la démo en vidéo
            </Button>
          </div>
          
          {/* Right Preview */}
          <div className="relative animate-fade-in" style={{ animationDelay: "150ms" }}>
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-2xl opacity-50" />
            <div className="relative rounded-xl overflow-hidden shadow-2xl border bg-card">
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">app.sanlam-allianz.com/b2b/dashboard</span>
              </div>
              <img 
                src={dashboardPreview} 
                alt="Aperçu du dashboard courtier Sanlam Allianz" 
                className="w-full h-auto"
              />
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground rounded-full px-4 py-2 shadow-lg font-medium text-sm animate-bounce">
              +34% conversion
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
