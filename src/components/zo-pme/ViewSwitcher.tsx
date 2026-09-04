import { Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_DEFINITIONS, ROLE_ORDER } from "@/data/zoPme";
import { useZoPme } from "./ZoPmeProvider";

/**
 * Sélecteur interne « Changer de vue » : visible uniquement pour Admin Zô PME.
 * Il permet d'endosser un périmètre métier (Direction, Marketing, Souscription…).
 */
export function ViewSwitcher() {
  const { role, setRole, can } = useZoPme();

  if (!can("view.switch")) return null;

  return (
    <div className="flex items-center gap-2">
      <Eye className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
      <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
        <SelectTrigger className="w-[210px] h-9" aria-label="Changer de vue métier">
          <SelectValue placeholder="Changer de vue" />
        </SelectTrigger>
        <SelectContent>
          {ROLE_ORDER.map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_DEFINITIONS[r].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
