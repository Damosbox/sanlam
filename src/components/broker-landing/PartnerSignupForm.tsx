import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Send, CheckCircle, Shield, Clock, Award } from "lucide-react";

const regions = [
  "Dakar",
  "Thiès",
  "Saint-Louis",
  "Kaolack",
  "Ziguinchor",
  "Diourbel",
  "Louga",
  "Fatick",
  "Tambacounda",
  "Kédougou",
  "Kolda",
  "Matam",
  "Sédhiou",
  "Kaffrine",
  "Autre",
];

const benefits = [
  { icon: Award, text: "Commissions jusqu'à 25%" },
  { icon: Shield, text: "Formation certifiante offerte" },
  { icon: Clock, text: "Réponse sous 48h" },
];

export const PartnerSignupForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    region: "",
    experience: "",
    acceptTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.acceptTerms) {
      toast.error("Veuillez accepter les conditions pour continuer");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast.success("Demande envoyée avec succès ! Nous vous contacterons sous 48h.");
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      region: "",
      experience: "",
      acceptTerms: false,
    });
    setIsSubmitting(false);
  };

  return (
    <section id="inscription" className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Rejoignez le réseau{" "}
              <span className="text-primary">Sanlam Allianz</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Remplissez le formulaire et notre équipe partenariat vous contactera 
              sous 48h pour discuter de votre profil et des opportunités de collaboration.
            </p>
            
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit.text} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
            
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Processus d'intégration
              </h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Soumission de votre candidature</li>
                <li>2. Entretien téléphonique (15 min)</li>
                <li>3. Formation en ligne (2h)</li>
                <li>4. Certification et accès plateforme</li>
              </ol>
            </div>
          </div>
          
          {/* Right Form */}
          <div className="animate-fade-in" style={{ animationDelay: "150ms" }}>
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border bg-card p-8 shadow-lg space-y-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean.dupont@cabinet.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+221 77 123 45 67"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="region">Région d'activité *</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) =>
                    setFormData({ ...formData, region: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre région" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="experience">Années d'expérience en courtage</Label>
                <Select
                  value={formData.experience}
                  onValueChange={(value) =>
                    setFormData({ ...formData, experience: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-2">0-2 ans</SelectItem>
                    <SelectItem value="3-5">3-5 ans</SelectItem>
                    <SelectItem value="6-10">6-10 ans</SelectItem>
                    <SelectItem value="10+">Plus de 10 ans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, acceptTerms: checked as boolean })
                  }
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                  J'accepte les conditions générales du programme partenaire et 
                  la politique de confidentialité de Sanlam Allianz.
                </Label>
              </div>
              
              <Button
                type="submit"
                size="lg"
                className="w-full gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Soumettre ma candidature
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
