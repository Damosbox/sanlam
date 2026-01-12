import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneOff, CheckCircle, Clock, XCircle, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export type ContactFilterType = "all" | "contacted" | "not_contacted";
export type RenewalFilterType = "all" | "renewed" | "pending" | "lost";

interface StatusCounts {
  contact?: {
    all: number;
    contacted: number;
    not_contacted: number;
  };
  renewal?: {
    all: number;
    renewed: number;
    pending: number;
    lost: number;
  };
}

interface RenewalStatusTogglesProps {
  contactFilter: ContactFilterType;
  renewalFilter: RenewalFilterType;
  onContactFilterChange: (value: ContactFilterType) => void;
  onRenewalFilterChange: (value: RenewalFilterType) => void;
  counts?: StatusCounts;
}

const CONTACT_OPTIONS = [
  { value: "all", label: "Tous", shortLabel: "Tous", icon: LayoutGrid },
  { value: "contacted", label: "Contactés", shortLabel: "Contactés", icon: Phone },
  { value: "not_contacted", label: "Non contactés", shortLabel: "Non cont.", icon: PhoneOff },
] as const;

const RENEWAL_OPTIONS = [
  { value: "all", label: "Tous", shortLabel: "Tous", icon: LayoutGrid },
  { value: "pending", label: "En attente", shortLabel: "Attente", icon: Clock },
  { value: "renewed", label: "Renouvelés", shortLabel: "Renouv.", icon: CheckCircle },
  { value: "lost", label: "Perdus", shortLabel: "Perdus", icon: XCircle },
] as const;

export const RenewalStatusToggles = ({
  contactFilter,
  renewalFilter,
  onContactFilterChange,
  onRenewalFilterChange,
  counts,
}: RenewalStatusTogglesProps) => {
  const isMobile = useIsMobile();

  const getContactCount = (value: ContactFilterType) => counts?.contact?.[value];
  const getRenewalCount = (value: RenewalFilterType) => counts?.renewal?.[value];

  // Mobile: Use Select dropdowns
  if (isMobile) {
    return (
      <div className="flex flex-col gap-2">
        {/* Contact Status Select */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium min-w-[70px]">Contact:</span>
          <Select 
            value={contactFilter} 
            onValueChange={(val) => onContactFilterChange(val as ContactFilterType)}
          >
            <SelectTrigger className="h-8 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    {option.label}
                    {getContactCount(option.value) !== undefined && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {getContactCount(option.value)}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Renewal Status Select */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium min-w-[70px]">Statut:</span>
          <Select 
            value={renewalFilter} 
            onValueChange={(val) => onRenewalFilterChange(val as RenewalFilterType)}
          >
            <SelectTrigger className="h-8 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RENEWAL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    {option.label}
                    {getRenewalCount(option.value) !== undefined && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {getRenewalCount(option.value)}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Desktop: Use ToggleGroups
  return (
    <div className="flex flex-wrap gap-3">
      {/* Contact Status Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Contact:</span>
        <ToggleGroup 
          type="single" 
          value={contactFilter}
          onValueChange={(val) => val && onContactFilterChange(val as ContactFilterType)}
          className="gap-1"
        >
          {CONTACT_OPTIONS.map((option) => {
            const count = getContactCount(option.value);
            return (
              <ToggleGroupItem 
                key={option.value}
                value={option.value} 
                size="sm"
                className={cn(
                  "text-xs px-2 h-7 gap-1",
                  option.value === "all" && contactFilter === "all" && "bg-primary text-primary-foreground",
                  option.value === "contacted" && contactFilter === "contacted" && "bg-emerald-100 text-emerald-700",
                  option.value === "not_contacted" && contactFilter === "not_contacted" && "bg-slate-100 text-slate-700"
                )}
              >
                <option.icon className="h-3 w-3" />
                <span className="hidden lg:inline">{option.label}</span>
                <span className="lg:hidden">{option.shortLabel}</span>
                {count !== undefined && count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "h-4 px-1 text-[10px] ml-0.5",
                      contactFilter === option.value 
                        ? "bg-background/20 text-current" 
                        : "bg-muted"
                    )}
                  >
                    {count}
                  </Badge>
                )}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      {/* Renewal Status Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Statut:</span>
        <ToggleGroup 
          type="single" 
          value={renewalFilter}
          onValueChange={(val) => val && onRenewalFilterChange(val as RenewalFilterType)}
          className="gap-1"
        >
          {RENEWAL_OPTIONS.map((option) => {
            const count = getRenewalCount(option.value);
            return (
              <ToggleGroupItem 
                key={option.value}
                value={option.value} 
                size="sm"
                className={cn(
                  "text-xs px-2 h-7 gap-1",
                  option.value === "all" && renewalFilter === "all" && "bg-primary text-primary-foreground",
                  option.value === "pending" && renewalFilter === "pending" && "bg-amber-100 text-amber-700",
                  option.value === "renewed" && renewalFilter === "renewed" && "bg-emerald-100 text-emerald-700",
                  option.value === "lost" && renewalFilter === "lost" && "bg-red-100 text-red-700"
                )}
              >
                <option.icon className="h-3 w-3" />
                <span className="hidden lg:inline">{option.label}</span>
                <span className="lg:hidden">{option.shortLabel}</span>
                {count !== undefined && count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "h-4 px-1 text-[10px] ml-0.5",
                      renewalFilter === option.value 
                        ? "bg-background/20 text-current" 
                        : "bg-muted"
                    )}
                  >
                    {count}
                  </Badge>
                )}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>
    </div>
  );
};
