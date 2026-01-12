import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, PhoneCall, PhoneForwarded, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ContactStatus = "not_contacted" | "contacted" | "reached" | "phone_issue";
type RenewalStatus = "pending" | "renewed" | "lost";

interface RenewalStatusDropdownProps {
  subscriptionId: string;
  type: "contact" | "renewal";
  currentValue: ContactStatus | RenewalStatus | null;
  onChurnReasonNeeded?: () => void;
}

const contactStatusConfig: Record<ContactStatus, { label: string; icon: React.ElementType; className: string }> = {
  not_contacted: { label: "Non contacté", icon: PhoneOff, className: "bg-muted text-muted-foreground" },
  contacted: { label: "Contacté", icon: Phone, className: "bg-blue-100 text-blue-700" },
  reached: { label: "Atteint", icon: PhoneCall, className: "bg-green-100 text-green-700" },
  phone_issue: { label: "Problème tél.", icon: PhoneForwarded, className: "bg-orange-100 text-orange-700" },
};

const renewalStatusConfig: Record<RenewalStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "En attente", icon: Clock, className: "bg-yellow-100 text-yellow-700" },
  renewed: { label: "Renouvelé", icon: CheckCircle, className: "bg-green-100 text-green-700" },
  lost: { label: "Perdu", icon: XCircle, className: "bg-red-100 text-red-700" },
};

export function RenewalStatusDropdown({ 
  subscriptionId, 
  type, 
  currentValue,
  onChurnReasonNeeded 
}: RenewalStatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newValue: string) => {
      const updateData: Record<string, unknown> = {};
      
      if (type === "contact") {
        updateData.contact_status = newValue;
        updateData.last_contacted_at = new Date().toISOString();
      } else {
        updateData.renewal_status = newValue;
        if (newValue === "renewed") {
          updateData.client_decision = "renewal";
          updateData.churn_reason = null;
        }
      }

      const { error } = await supabase
        .from("subscriptions")
        .update(updateData)
        .eq("id", subscriptionId);

      if (error) throw error;
      return newValue;
    },
    onSuccess: (newValue) => {
      queryClient.invalidateQueries({ queryKey: ["broker-renewals"] });
      
      const config = type === "contact" 
        ? contactStatusConfig[newValue as ContactStatus]
        : renewalStatusConfig[newValue as RenewalStatus];
      
      toast({
        title: "Statut mis à jour",
        description: `Nouveau statut : ${config.label}`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    },
  });

  const handleSelect = (value: string) => {
    if (type === "renewal" && value === "lost") {
      setOpen(false);
      onChurnReasonNeeded?.();
      return;
    }
    mutation.mutate(value);
    setOpen(false);
  };

  const config = type === "contact" ? contactStatusConfig : renewalStatusConfig;
  const currentConfig = currentValue 
    ? config[currentValue as keyof typeof config] 
    : type === "contact" 
      ? contactStatusConfig.not_contacted 
      : renewalStatusConfig.pending;

  const Icon = currentConfig.icon;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Badge 
          className={cn(
            "cursor-pointer hover:opacity-80 transition-opacity gap-1",
            currentConfig.className
          )}
          variant="outline"
        >
          <Icon className="h-3 w-3" />
          {currentConfig.label}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {Object.entries(config).map(([key, { label, icon: ItemIcon, className }]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleSelect(key)}
            className={cn(
              "cursor-pointer gap-2",
              currentValue === key && "bg-accent"
            )}
          >
            <ItemIcon className="h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
