import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Phone, User, Shield, PiggyBank, TrendingUp, Car, Heart, GraduationCap, Home as HomeIcon, Target, Zap, BarChart3, FileCheck, Headphones, BookOpen, Users } from "lucide-react";
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
import { cn } from "@/lib/utils";

// Routes where we hide the public navigation (inside platforms)
const platformRoutes = ["/b2b", "/b2c", "/admin", "/claim"];

export const Header = () => {
  const location = useLocation();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  // Check if we're inside a platform
  const isInsidePlatform = platformRoutes.some(route => location.pathname.startsWith(route));
  
  // Check if we're on public pages (home, commercial)
  const isPublicPage = location.pathname === "/" || location.pathname === "/commercial" || location.pathname.startsWith("/simulateur") || location.pathname.startsWith("/assurance") || location.pathname.startsWith("/sinistres") || location.pathname.startsWith("/commercial/");
  
  // Check which segment we're on
  const isCommercialPage = location.pathname === "/commercial" || location.pathname.startsWith("/commercial/");

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

  // Particuliers navigation
  const insuranceProducts = [
    { name: "Assurance Auto", description: "Roulez en toute confiance", href: "/assurance/auto", icon: Car },
    { name: "Assurance Habitation", description: "Protégez votre foyer", href: "/assurance/habitation", icon: HomeIcon },
    { name: "Assurance Santé", description: "Prenez soin de votre santé", href: "/assurance/sante", icon: Heart },
    { name: "Assurance Vie", description: "Protégez vos proches", href: "/assurance/vie", icon: Shield },
  ];

  const savingsProducts = [
    { name: "Épargne Plus", description: "Faites fructifier votre argent", href: "/simulateur-epargne", icon: PiggyBank },
    { name: "Educ'Plus", description: "Préparez l'avenir de vos enfants", href: "/simulateur-education", icon: GraduationCap },
    { name: "Plan Retraite", description: "Anticipez votre retraite", href: "/simulateur-epargne", icon: TrendingUp },
  ];

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
      {/* Top Bar - Segment Selector (only on public pages) */}
      {isPublicPage && (
        <div className="bg-secondary text-secondary-foreground">
          <div className="container flex h-10 items-center justify-between">
            <div className="flex items-center">
              <Link
                to="/"
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-all border-b-2",
                  location.pathname === "/" || location.pathname.startsWith("/simulateur")
                    ? "border-white text-white"
                    : "border-transparent text-white/70 hover:text-white"
                )}
              >
                Particuliers
              </Link>
              <Link
                to="/commercial"
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-all border-b-2",
                  location.pathname === "/commercial"
                    ? "border-white text-white"
                    : "border-transparent text-white/70 hover:text-white"
                )}
              >
                Intermédiaires
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <a href="tel:+2252720259700" className="flex items-center gap-2 text-sm text-white/80 hover:text-white">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">(+225) 27 20 25 97 00</span>
              </a>
              
              {user ? (
                <div className="flex items-center gap-2">
                  <Link to="/b2b/dashboard">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <LogoutButton />
                </div>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <User className="w-4 h-4 mr-2" />
                    Se connecter
                  </Button>
                </Link>
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

            {/* Sub-menus hidden as per request */}

            {/* Commercial navigation */}
            {isCommercialPage && (
              <NavigationMenu className="hidden md:flex">
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent">
                      <Zap className="w-4 h-4 mr-2 text-primary" />
                      Outils
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                        {commercialTools.map((tool) => (
                          <li key={tool.name}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={tool.href}
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent/10 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              >
                                <div className="flex items-center gap-2">
                                  <tool.icon className="w-4 h-4 text-primary" />
                                  <div className="text-sm font-medium leading-none">{tool.name}</div>
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {tool.description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent">
                      <BookOpen className="w-4 h-4 mr-2 text-primary" />
                      Ressources
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4">
                        {commercialResources.map((resource) => (
                          <li key={resource.name}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={resource.href}
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent/10 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              >
                                <div className="flex items-center gap-2">
                                  <resource.icon className="w-4 h-4 text-primary" />
                                  <div className="text-sm font-medium leading-none">{resource.name}</div>
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {resource.description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <Link to="/b2b/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Mon Dashboard
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Show different CTAs based on context */}
            {isPublicPage && !isCommercialPage && (
              <Link to="/b2c">
                <Button className="hidden sm:flex">
                  Obtenir un devis
                </Button>
              </Link>
            )}
            
            {/* Commercial CTA */}
            {isCommercialPage && (
              <Link to="/auth?broker=true">
                <Button className="hidden sm:flex">
                  Accéder à mon espace
                </Button>
              </Link>
            )}
            
            {/* Show login on non-public pages if not inside platform */}
            {!isPublicPage && !isInsidePlatform && !user && (
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Se connecter
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};