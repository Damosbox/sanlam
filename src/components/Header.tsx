import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Phone, User, Target, Zap, BarChart3, FileCheck, Headphones, BookOpen, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import LogoutButton from "./LogoutButton";
import sanlamLogo from "@/assets/logo_sanlam.svg";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

// Routes where we hide the public navigation (inside platforms)
const platformRoutes = ["/b2b", "/b2c", "/admin", "/claim"];

export const Header = () => {
  const location = useLocation();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  // Check if we're inside a platform
  const isInsidePlatform = platformRoutes.some(route => location.pathname.startsWith(route));
  
  // Check if we're on public pages
  const isPublicPage = location.pathname === "/" || location.pathname.startsWith("/simulateur") || location.pathname.startsWith("/assurance") || location.pathname.startsWith("/sinistres") || location.pathname.startsWith("/commercial/");

  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Commercial navigation
  const commercialTools = [
    { name: "Pipeline Leads", description: "Gérez vos prospects efficacement", href: "/commercial/outils/pipeline", icon: Target },
    { name: "Vente Guidée", description: "Processus de vente structuré", href: "/commercial/outils/vente-guidee", icon: Zap },
    { name: "Analytics", description: "Suivez vos performances", href: "/commercial/outils/analytics", icon: BarChart3 },
    { name: "Compliance KYC", description: "Vérifications réglementaires", href: "/commercial/outils/kyc", icon: FileCheck },
  ];

  const commercialResources = [
    { name: "Formation", description: "Modules de formation continue", href: "/commercial/ressources/formation", icon: BookOpen },
    { name: "Support", description: "Assistance et FAQ", href: "/commercial/ressources/support", icon: Headphones },
    { name: "Communauté", description: "Réseau de commerciaux", href: "/commercial/ressources/communaute", icon: Users },
  ];

  // If inside platform, show minimal header
  if (isInsidePlatform) {
    return (
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={sanlamLogo} alt="Sanlam Allianz" className="h-8 w-auto sm:h-10" />
          </Link>

          <div className="flex items-center gap-4">
            <a href="tel:+2252720259700" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">(+225) 27 20 25 97 00</span>
            </a>
            
            {user && <LogoutButton />}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Bar (only on public pages) */}
      {isPublicPage && (
        <div className="bg-secondary text-secondary-foreground">
          <div className="container flex h-10 items-center justify-end">
            <div className="flex items-center gap-4">
              <a href="tel:+2252720259700" className="flex items-center gap-2 text-sm text-white/80 hover:text-white">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">(+225) 27 20 25 97 00</span>
              </a>
              
              {user && (
                <div className="flex items-center gap-2">
                  <Link to="/b2b/dashboard">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <LogoutButton />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              <img src={sanlamLogo} alt="Sanlam Allianz" className="h-8 w-auto sm:h-10" />
            </Link>

          </div>

          <div className="flex items-center gap-2">
            {!user && (
              <Link to="/auth/partner">
                <Button>
                  Se connecter à mon espace
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
