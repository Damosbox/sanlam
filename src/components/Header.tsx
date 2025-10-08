import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import LogoutButton from "./LogoutButton";

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
          <div className="w-10 h-10 rounded-full gradient-activated flex items-center justify-center">
            <span className="text-white font-bold text-lg">AS</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-none">Allianz Sanlam</span>
            <span className="text-xs text-muted-foreground">IA-First Platform</span>
          </div>
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
