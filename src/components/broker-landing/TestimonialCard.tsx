import { Star } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  location: string;
  rating: number;
  imageUrl?: string;
}

export const TestimonialCard = ({
  quote,
  author,
  role,
  location,
  rating,
  imageUrl,
}: TestimonialCardProps) => {
  return (
    <div className="group relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
          />
        ))}
      </div>
      
      {/* Quote */}
      <blockquote className="text-foreground mb-6 leading-relaxed">
        "{quote}"
      </blockquote>
      
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={author} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-primary">
              {author.charAt(0)}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold text-foreground">{author}</p>
          <p className="text-sm text-muted-foreground">{role} • {location}</p>
        </div>
      </div>
    </div>
  );
};

const testimonials = [
  {
    quote: "Depuis que j'utilise la plateforme, mon taux de conversion est passé de 15% à 38%. Les recommandations IA sont bluffantes de précision.",
    author: "Amadou Diallo",
    role: "Courtier indépendant",
    location: "Dakar",
    rating: 5,
  },
  {
    quote: "Le processus de vente guidée m'a permis de réduire mon temps par dossier de 45 minutes à 15 minutes. Je traite 3x plus de clients.",
    author: "Marie Kouassi",
    role: "Responsable agence",
    location: "Abidjan",
    rating: 5,
  },
  {
    quote: "L'analyse concurrentielle est un game-changer. Je gagne systématiquement les appels d'offres face à la concurrence grâce aux arguments générés.",
    author: "Ibrahim Touré",
    role: "Courtier senior",
    location: "Bamako",
    rating: 5,
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Ils ont transformé leur{" "}
            <span className="text-primary">activité</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Découvrez comment nos courtiers partenaires ont multiplié leurs performances 
            grâce à la plateforme Sanlam Allianz.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <TestimonialCard {...testimonial} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
