import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Users, Trophy, Calendar, MessageSquare, Star, Target, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: Users, title: "Réseau de pairs", description: "Échangez avec d'autres commerciaux" },
  { icon: Trophy, title: "Challenges", description: "Participez à des concours et gagnez" },
  { icon: Calendar, title: "Événements", description: "Webinaires et rencontres régulières" },
  { icon: MessageSquare, title: "Forum", description: "Partagez vos best practices" },
];

const testimonials = [
  { name: "Kouadio Serge", role: "Commercial Senior", quote: "La communauté m'a permis de doubler mes ventes en 6 mois grâce aux conseils des autres.", avatar: "KS" },
  { name: "Aminata Diallo", role: "Responsable Zone", quote: "Les challenges mensuels motivent toute mon équipe. C'est un vrai plus pour la performance.", avatar: "AD" },
  { name: "Jean-Marc Aka", role: "Commercial", quote: "Le forum est une mine d'or pour trouver des réponses aux situations complexes.", avatar: "JA" },
];

const Communaute = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                Communauté
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Ensemble, on va plus loin
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Rejoignez une communauté dynamique de commerciaux passionnés. Partagez vos expériences, apprenez des meilleurs et célébrez vos succès.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/auth?broker=true")}>
                  Rejoindre la communauté
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  Découvrir les événements
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop" 
                alt="Communauté" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Ce qui vous attend</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Commerciaux actifs</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-muted-foreground">Événements par an</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-muted-foreground">Discussions actives</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">12</div>
              <div className="text-muted-foreground">Challenges annuels</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Ils font partie de la communauté</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à rejoindre l'aventure ?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Connectez-vous et découvrez une communauté qui vous ressemble.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth?broker=true")}>
            Rejoindre maintenant
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Communaute;
