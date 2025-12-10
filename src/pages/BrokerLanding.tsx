import { Header } from "@/components/Header";
import { HeroSection } from "@/components/broker-landing/HeroSection";
import { FeaturesGrid } from "@/components/broker-landing/FeaturesGrid";
import { DashboardPreview } from "@/components/broker-landing/DashboardPreview";
import { TestimonialsSection } from "@/components/broker-landing/TestimonialCard";
import { PartnerSignupForm } from "@/components/broker-landing/PartnerSignupForm";
import { Link } from "react-router-dom";
import sanlamLogo from "@/assets/logo_sanlam.svg";

const BrokerLanding = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <HeroSection />
        <FeaturesGrid />
        <DashboardPreview />
        <TestimonialsSection />
        <PartnerSignupForm />
      </main>
      
      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <img src={sanlamLogo} alt="Sanlam Allianz" className="h-8" />
              <p className="text-sm text-muted-foreground">
                Leader de l'assurance en Afrique de l'Ouest. 
                Innovation, confiance et proximité depuis 1989.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Programme Partenaire</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Devenir courtier</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Avantages partenaires</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Formation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produits</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-primary transition-colors">Assurance Auto</Link></li>
                <li><Link to="/" className="hover:text-primary transition-colors">Épargne & Retraite</Link></li>
                <li><Link to="/" className="hover:text-primary transition-colors">Assurance Santé</Link></li>
                <li><Link to="/" className="hover:text-primary transition-colors">Assurance Habitation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>partenaires@sanlam-allianz.com</li>
                <li>+221 33 123 45 67</li>
                <li>Dakar, Sénégal</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Sanlam Allianz. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BrokerLanding;
