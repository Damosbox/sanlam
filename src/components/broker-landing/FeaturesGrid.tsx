import { 
  Users, 
  GitBranch, 
  Brain, 
  Shield, 
  FileCheck, 
  MessageSquare,
  TrendingUp,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Pipeline Leads Intelligent",
    description: "Recevez des leads qualifiés automatiquement et suivez chaque prospect avec un CRM intégré. Filtres avancés, statuts personnalisés et historique complet.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: GitBranch,
    title: "Vente Guidée 6 Étapes",
    description: "Processus de vente structuré de l'analyse des besoins jusqu'à l'émission. Devis instantané, tarification temps réel et signature électronique.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Brain,
    title: "Recommandations IA",
    description: "L'intelligence artificielle analyse le profil client et suggère les produits adaptés. Argumentaires personnalisés et objections anticipées.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: Shield,
    title: "KYC & Compliance",
    description: "Collecte automatisée des documents réglementaires. Vérification PPE/AML intégrée et conformité CIMA garantie.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: FileCheck,
    title: "Analyse Concurrentielle",
    description: "Uploadez un produit concurrent et obtenez une analyse comparative détaillée avec arguments de vente personnalisés.",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    icon: MessageSquare,
    title: "Communication Omnicanale",
    description: "Contactez vos prospects par email, SMS ou WhatsApp directement depuis la plateforme. Modèles personnalisables et suivi des interactions.",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    icon: TrendingUp,
    title: "Dashboard Analytique",
    description: "Visualisez vos KPIs en temps réel : taux de conversion, commissions, performance par produit. Objectifs et comparatifs mensuels.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Zap,
    title: "Automatisation Workflow",
    description: "Rappels automatiques, relances programmées et notifications intelligentes. Gagnez du temps sur les tâches administratives.",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
];

export const FeaturesGrid = () => {
  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Tout ce dont vous avez besoin pour{" "}
            <span className="text-primary">réussir</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Une plateforme complète conçue par des courtiers, pour des courtiers. 
            Chaque fonctionnalité a été pensée pour maximiser votre efficacité commerciale.
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`inline-flex rounded-lg p-3 ${feature.bgColor} mb-4`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
