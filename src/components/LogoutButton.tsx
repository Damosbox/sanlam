import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Déconnexion réussie");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la déconnexion");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} className="px-2 sm:px-3">
      <LogOut className="w-4 h-4 sm:mr-2" />
      <span className="hidden sm:inline">Se déconnecter</span>
    </Button>
  );
}
