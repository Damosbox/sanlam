import { useEffect, useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Smartphone, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import dashboardPreview from "@/assets/dashboard-preview.jpg";

const slides = [
  {
    title: "Bienvenue sur votre espace",
    text: "Une plateforme unique pour connecter, accompagner et renforcer durablement notre réseau d'intermédiaires.",
  },
  {
    title: "Un seul espace. Tous vos outils.",
    text: "Pilotez vos activités, accédez aux services et suivez vos performances dans un environnement simple et centralisé.",
  },
  {
    title: "Une expérience simple, humaine et efficace.",
    text: "Des parcours clairs, une assistance disponible et un accompagnement pensé pour chaque étape de votre activité.",
  },
  {
    title: "Des outils conçus pour votre performance.",
    text: "Gagnez en efficacité, en visibilité et en réactivité grâce à des outils adaptés à votre quotidien.",
  },
  {
    title: "Un écosystème qui anticipe vos besoins.",
    text: "Une plateforme conçue pour évoluer avec vos besoins et enrichir progressivement votre expérience.",
  },
];

const badges = [
  { icon: Shield, label: "Plateforme sécurisée" },
  { icon: Users, label: "Accompagnement dédié" },
  { icon: Smartphone, label: "Accessible web et mobile" },
  { icon: Rocket, label: "En constante évolution" },
];

const HeroCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 6000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative overflow-hidden gradient-activated">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, index) => (
            <div key={index} className="min-w-0 shrink-0 grow-0 basis-full">
              <div className="container py-16 md:py-24">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                      {slide.title}
                    </h1>
                    <p className="text-white/80 text-lg max-w-xl">
                      {slide.text}
                    </p>
                    <Link to="/auth/partner">
                      <Button size="lg" className="bg-white text-primary hover:bg-white/90 mt-4">
                        Se connecter à mon espace
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                  <div className="hidden lg:block">
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                      <img
                        src={dashboardPreview}
                        alt="Dashboard Intermédiaire"
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-28 md:bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === selectedIndex ? "bg-white scale-125" : "bg-white/40"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Badges */}
      <div className="relative z-10 pb-6">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/20"
              >
                <badge.icon className="w-5 h-5 text-white" />
                <span className="text-sm font-medium text-white">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
