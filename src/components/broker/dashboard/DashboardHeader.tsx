import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCw } from "lucide-react";

export const DashboardHeader = () => {
  const [agentName, setAgentName] = useState("Agent");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState(new Date());

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile?.display_name) {
          setAgentName(profile.display_name);
        } else if (user.email) {
          setAgentName(user.email.split("@")[0]);
        }
        setAvatarUrl(profile?.avatar_url || null);
      }
    };
    fetchProfile();
  }, []);

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent rounded-2xl border border-border/50">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 border-2 border-primary/20">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {getInitials(agentName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bonjour {agentName} 👋
          </h1>
          <p className="text-muted-foreground">
            Voici un aperçu de vos activités et priorités du jour.
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 px-3 py-2 rounded-lg">
        <RefreshCw className="h-3 w-3" />
        <span>Sync: {lastSync.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>
  );
};
