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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/10 shrink-0">
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className="bg-primary/5 text-primary font-semibold text-xs sm:text-sm">
          {getInitials(agentName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">
          {getGreeting()} {agentName} 👋
        </h1>
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
          <span className="truncate">Tes priorités du jour</span>
          <span className="text-border hidden sm:inline">•</span>
          <span className="hidden sm:flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            {lastSync.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
};
