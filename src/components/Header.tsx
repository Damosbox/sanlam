import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import LogoutButton from "./LogoutButton";
import sanlamLogo from "@/assets/logo_sanlam.svg";

export const Header = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img 
            src={sanlamLogo} 
            alt="Sanlam Allianz" 
            className="h-6 w-auto sm:h-8"
          />
        </Link>

        <nav className="flex items-center gap-2">
          {!isHome && (
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Accueil
              </Button>
            </Link>
          )}
          {user ? (
            <LogoutButton />
          ) : (
            <Link to="/auth">
              <Button variant="default" size="sm">
                Se connecter
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon">
            <Menu className="w-5 h-5" />
          </Button>
        </nav>
      </div>
    </header>
  );
};
