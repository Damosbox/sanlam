import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CARD_STATUS_LABELS,
  CARD_STATUS_STYLES,
  SEVERITY_LABELS,
  SEVERITY_STYLES,
  TIER_META,
  TIER_ORDER,
  isSlaBreached,
  type CardStatus,
  type Severity,
  type Tier,
  type ZoCard,
} from "@/data/zoPme";
import { LIFECYCLE_LABELS, LIFECYCLE_STYLES } from "@/data/zoPme/members";
import type { PmeLifecycle } from "@/data/zoPme/types";
import { AlertTriangle, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn("text-[11px] px-1.5 py-0", TIER_META[tier].badge, className)}
        >
          {tier}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs font-medium">{tier}</p>
        <p className="text-xs text-muted-foreground">{TIER_META[tier].avantages}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function TierLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {TIER_ORDER.map((tier) => (
        <TierBadge key={tier} tier={tier} />
      ))}
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] px-1.5 py-0", SEVERITY_STYLES[severity])}
    >
      {SEVERITY_LABELS[severity]}
    </Badge>
  );
}

export function CardStatusBadge({ status }: { status: CardStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] px-1.5 py-0 whitespace-nowrap", CARD_STATUS_STYLES[status])}
    >
      {CARD_STATUS_LABELS[status]}
    </Badge>
  );
}

export function LifecycleBadge({ status }: { status: PmeLifecycle }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] px-1.5 py-0 whitespace-nowrap", LIFECYCLE_STYLES[status])}
    >
      {LIFECYCLE_LABELS[status]}
    </Badge>
  );
}

export function SlaBadge({ card }: { card: ZoCard }) {
  if (card.slaCibleHeures === 0) {
    return <span className="text-xs text-muted-foreground">Hors SLA</span>;
  }
  const breached = isSlaBreached(card);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        breached ? "text-destructive font-medium" : "text-muted-foreground"
      )}
    >
      {breached ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {card.slaEcouleHeures} h / {card.slaCibleHeures} h
    </span>
  );
}
