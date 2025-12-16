import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Headphones, MessageCircle, FileQuestion, Clock, Phone, Mail, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const supportChannels = [
  { icon: Headphones, title: "Hotline dédiée", description: "Ligne prioritaire pour les commerciaux" },
  { icon: MessageCircle, title: "Chat en direct", description: "Assistance instantanée via chat" },
  { icon: FileQuestion, title: "Base de connaissances", description: "FAQ et guides détaillés" },
  { icon: Clock, title: "Support 24/7", description: "Disponible à tout moment" },
];

const faqItems = [
  { question: "Comment réinitialiser mon mot de passe ?", answer: "Rendez-vous sur la page de connexion et cliquez sur 'Mot de passe oublié'." },
  { question: "Comment contacter mon manager ?", answer: "Utilisez la messagerie interne ou consultez l'annuaire de l'équipe." },
  { question: "Où trouver mes commissions ?", answer: "Dans votre dashboard, section 'Mes commissions' ou 'Analytics'." },
  { question: "Comment modifier un devis ?", answer: "Ouvrez le devis depuis 'Mes ventes' et cliquez sur 'Modifier'." },
];

const Support = () => {
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
                Support Commercial
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Une équipe dédiée à votre réussite
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Notre équipe support est là pour vous accompagner au quotidien. Questions techniques, conseils commerciaux ou assistance produit, nous sommes là.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/auth?broker=true")}>
                  Contacter le support
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  <Phone className="mr-2 h-5 w-5" />
                  +225 27 20 25 25 25
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=600&h=400&fit=crop" 
                alt="Support client" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Plusieurs façons de nous joindre</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {supportChannels.map((channel, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <channel.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{channel.title}</h3>
                  <p className="text-muted-foreground">{channel.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Questions fréquentes</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqItems.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{item.question}</h3>
                  <p className="text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => navigate("/auth?broker=true")}>
              Voir toutes les FAQ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="p-8">
                <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Téléphone</h3>
                <p className="text-muted-foreground">+225 27 20 25 25 25</p>
                <p className="text-sm text-muted-foreground">Lun-Ven 8h-18h</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-8">
                <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-muted-foreground">support@sanlam-allianz.ci</p>
                <p className="text-sm text-muted-foreground">Réponse sous 24h</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-8">
                <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">WhatsApp</h3>
                <p className="text-muted-foreground">+225 07 07 07 07 07</p>
                <p className="text-sm text-muted-foreground">24h/24 - 7j/7</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Besoin d'aide maintenant ?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Notre équipe est disponible pour répondre à toutes vos questions.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth?broker=true")}>
            Ouvrir un ticket
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Support;
