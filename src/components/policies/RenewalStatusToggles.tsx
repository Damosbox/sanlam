import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Phone, PhoneOff, CheckCircle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RenewalStatusTogglesProps {
  contactFilter: "all" | "contacted" | "not_contacted";
  renewalFilter: "all" | "renewed" | "pending" | "lost";
  onContactFilterChange: (value: "all" | "contacted" | "not_contacted") => void;
  onRenewalFilterChange: (value: "all" | "renewed" | "pending" | "lost") => void;
}

export const RenewalStatusToggles = ({
  contactFilter,
  renewalFilter,
  onContactFilterChange,
  onRenewalFilterChange,
}: RenewalStatusTogglesProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Contact Status Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Contact:</span>
        <ToggleGroup 
          type="single" 
          value={contactFilter}
          onValueChange={(val) => val && onContactFilterChange(val as any)}
          className="gap-1"
        >
          <ToggleGroupItem 
            value="all" 
            size="sm"
            className={cn(
              "text-xs px-2 h-7",
              contactFilter === "all" && "bg-primary text-primary-foreground"
            )}
          >
            Tous
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="contacted" 
            size="sm"
            className={cn(
              "text-xs px-2 h-7 gap-1",
              contactFilter === "contacted" && "bg-emerald-100 text-emerald-700"
            )}
          >
            <Phone className="h-3 w-3" />
            Contactés
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="not_contacted" 
            size="sm"
            className={cn(
              "text-xs px-2 h-7 gap-1",
              contactFilter === "not_contacted" && "bg-slate-100 text-slate-700"
            )}
          >
            <PhoneOff className="h-3 w-3" />
            Non contactés
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Renewal Status Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Renouvellement:</span>
        <ToggleGroup 
          type="single" 
          value={renewalFilter}
          onValueChange={(val) => val && onRenewalFilterChange(val as any)}
          className="gap-1"
        >
          <ToggleGroupItem 
            value="all" 
            size="sm"
            className={cn(
              "text-xs px-2 h-7",
              renewalFilter === "all" && "bg-primary text-primary-foreground"
            )}
          >
            Tous
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="pending" 
            size="sm"
            className={cn(
              "text-xs px-2 h-7 gap-1",
              renewalFilter === "pending" && "bg-amber-100 text-amber-700"
            )}
          >
            <Clock className="h-3 w-3" />
            En attente
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="renewed" 
            size="sm"
            className={cn(
              "text-xs px-2 h-7 gap-1",
              renewalFilter === "renewed" && "bg-emerald-100 text-emerald-700"
            )}
          >
            <CheckCircle className="h-3 w-3" />
            Renouvelés
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="lost" 
            size="sm"
            className={cn(
              "text-xs px-2 h-7 gap-1",
              renewalFilter === "lost" && "bg-red-100 text-red-700"
            )}
          >
            <XCircle className="h-3 w-3" />
            Perdus
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};
