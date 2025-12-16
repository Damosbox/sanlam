import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GraduationCap, BookOpen, Video, Award, CheckCircle2, ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

const modules = [
  { icon: BookOpen, title: "Fondamentaux", description: "Les bases de l'assurance CIMA" },
  { icon: Video, title: "Tutoriels vidéo", description: "Maîtrisez la plateforme" },
  { icon: GraduationCap, title: "Certification", description: "Validez vos compétences" },
  { icon: Award, title: "Spécialisations", description: "Devenez expert produit" },
];

const courses = [
  "Introduction à l'assurance vie",
  "Maîtrise de l'assurance auto CIMA",
  "Techniques de vente avancées",
  "Conformité et réglementation",
  "Gestion de la relation client",
  "Utilisation de la plateforme",
  "Analyse des besoins client",
  "Traitement des objections",
];

const Formation = () => {
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
                Centre de Formation
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Développez vos compétences commerciales
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Accédez à des formations certifiantes pour maîtriser nos produits, affiner vos techniques de vente et booster votre carrière.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/auth?broker=true")}>
                  Accéder aux formations
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  <Play className="mr-2 h-5 w-5" />
                  Voir un aperçu
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop" 
                alt="Formation en ligne" 
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nos parcours de formation</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {modules.map((module, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <module.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                  <p className="text-muted-foreground">{module.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Catalogue de cours</h2>
              <p className="text-muted-foreground mb-8">
                Des formations adaptées à tous les niveaux, du débutant à l'expert.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map((course, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{course}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-background rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Certification incluse</h3>
              <p className="text-muted-foreground mb-6">
                Obtenez un certificat reconnu à l'issue de chaque parcours de formation.
              </p>
              <div className="flex items-center gap-4 mb-6">
                <Award className="h-12 w-12 text-primary" />
                <div>
                  <div className="font-semibold">Certificat Sanlam Allianz</div>
                  <div className="text-sm text-muted-foreground">Validez vos acquis</div>
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={() => navigate("/auth?broker=true")}>
                Commencer ma formation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Investissez dans votre réussite</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Les meilleurs commerciaux sont ceux qui ne cessent jamais d'apprendre.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate("/auth?broker=true")}>
            Démarrer ma formation
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Formation;
