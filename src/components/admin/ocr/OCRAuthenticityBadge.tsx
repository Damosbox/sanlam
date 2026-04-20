import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from "lucide-react";

interface Props {
  status: "authentic" | "suspicious" | "fake" | "unverified" | string;
  score?: number;
}

export function OCRAuthenticityBadge({ status, score }: Props) {
  const config = {
    authentic: { label: "Authentique", icon: ShieldCheck, className: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300" },
    suspicious: { label: "Suspect", icon: ShieldAlert, className: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300" },
    fake: { label: "Falsifié", icon: ShieldX, className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300" },
    unverified: { label: "Non vérifié", icon: ShieldQuestion, className: "bg-muted text-muted-foreground border-border" },
  }[status] || { label: status, icon: ShieldQuestion, className: "bg-muted text-muted-foreground" };

  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
      {typeof score === "number" && score > 0 && <span className="font-mono">· {Math.round(score)}%</span>}
    </Badge>
  );
}