import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function RoleProtectedRoute({ 
  children, 
  allowedRoles 
}: RoleProtectedRouteProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { role, loading: roleLoading } = useUserRole(user);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check role access once role is loaded
  useEffect(() => {
    if (!authLoading && !roleLoading && user && role) {
      if (!allowedRoles.includes(role)) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
          variant: "destructive",
        });
        
        // Redirect based on role
        if (role === "customer") {
          navigate("/b2c");
        } else if (role === "broker") {
          navigate("/b2b");
        } else if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    }
  }, [authLoading, roleLoading, user, role, allowedRoles, navigate, toast]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !session || !role) {
    return null;
  }

  if (!allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
