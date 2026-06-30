import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Percent, TrendingUp, ShieldCheck } from "lucide-react";
import type { ProductFormData } from "../ProductForm";

export interface PricingAdjustmentsConfig {
  reduction_souscription: {
    enabled: boolean;
    roles: string[];
    max_percentage: number;
    type: "percentage" | "commission";
  };
  bonus_malus_renouvellement: {
    enabled: boolean;
    roles: string[];
    max_bonus: number;
    max_malus: number;
    cumul_with_commercial: boolean;
  };
  approval: {
    required: boolean;
    threshold_reduction_pct: number;
    threshold_bonus_malus_pct: number;
    validator_roles: string[];
  };
}

export const DEFAULT_PRICING_ADJUSTMENTS: PricingAdjustmentsConfig = {
  reduction_souscription: { enabled: false, roles: [], max_percentage: 0, type: "percentage" },
  bonus_malus_renouvellement: { enabled: false, roles: [], max_bonus: 0, max_malus: 0, cumul_with_commercial: false },
  approval: { required: false, threshold_reduction_pct: 10, threshold_bonus_malus_pct: 10, validator_roles: ["admin"] },
};

const ROLE_OPTIONS = [
  { value: "broker", label: "Broker / Commercial" },
  { value: "backoffice_crc", label: "Back-office CRC" },
  { value: "backoffice_conformite", label: "Back-office Conformité" },
  { value: "admin", label: "Admin" },
];

interface DiscountsTabProps {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
}

function RolesPicker({
  value,
  onChange,
  idPrefix,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  idPrefix: string;
}) {
  const toggle = (role: string) => {
    onChange(value.includes(role) ? value.filter((r) => r !== role) : [...value, role]);
  };
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {ROLE_OPTIONS.map((r) => (
        <label
          key={r.value}
          htmlFor={`${idPrefix}-${r.value}`}
          className="flex items-center gap-2 p-2 rounded-md border bg-background hover:bg-accent/40 cursor-pointer"
        >
          <Checkbox
            id={`${idPrefix}-${r.value}`}
            checked={value.includes(r.value)}
            onCheckedChange={() => toggle(r.value)}
          />
          <span className="text-sm">{r.label}</span>
        </label>
      ))}
    </div>
  );
}

export function DiscountsTab({ formData, updateField }: DiscountsTabProps) {
  const cfg: PricingAdjustmentsConfig = {
    ...DEFAULT_PRICING_ADJUSTMENTS,
    ...((formData as any).pricing_adjustments || {}),
    reduction_souscription: {
      ...DEFAULT_PRICING_ADJUSTMENTS.reduction_souscription,
      ...(((formData as any).pricing_adjustments || {}).reduction_souscription || {}),
    },
    bonus_malus_renouvellement: {
      ...DEFAULT_PRICING_ADJUSTMENTS.bonus_malus_renouvellement,
      ...(((formData as any).pricing_adjustments || {}).bonus_malus_renouvellement || {}),
    },
    approval: {
      ...DEFAULT_PRICING_ADJUSTMENTS.approval,
      ...(((formData as any).pricing_adjustments || {}).approval || {}),
    },
  };

  const update = <K extends keyof PricingAdjustmentsConfig>(
    section: K,
    patch: Partial<PricingAdjustmentsConfig[K]>,
  ) => {
    const next: PricingAdjustmentsConfig = {
      ...cfg,
      [section]: { ...cfg[section], ...patch },
    };
    updateField("pricing_adjustments" as any, next as any);
  };

  const r = cfg.reduction_souscription;
  const bm = cfg.bonus_malus_renouvellement;
  const a = cfg.approval;

  return (
    <div className="space-y-6">
      {/* Bloc 1 — Réduction à la souscription */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                <Percent className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Réduction à la souscription</CardTitle>
                <CardDescription>
                  Autorise les commerciaux à accorder une remise commerciale lors de l'émission d'un nouveau contrat.
                </CardDescription>
              </div>
            </div>
            <Switch checked={r.enabled} onCheckedChange={(v) => update("reduction_souscription", { enabled: v })} />
          </div>
        </CardHeader>
        {r.enabled && (
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de réduction</Label>
                <Select
                  value={r.type}
                  onValueChange={(v) => update("reduction_souscription", { type: v as "percentage" | "commission" })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage sur la prime</SelectItem>
                    <SelectItem value="commission">Prélèvement sur commission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pourcentage maximum (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={r.max_percentage}
                  onChange={(e) =>
                    update("reduction_souscription", { max_percentage: Math.max(0, Math.min(100, +e.target.value || 0)) })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Les commerciaux pourront accorder jusqu'à ce plafond sans approbation.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rôles autorisés</Label>
              <RolesPicker
                idPrefix="reduction"
                value={r.roles}
                onChange={(roles) => update("reduction_souscription", { roles })}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bloc 2 — Bonus/Malus au renouvellement */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Bonus / Malus au renouvellement</CardTitle>
                <CardDescription>
                  Permet d'ajuster la prime au renouvellement selon la sinistralité ou la fidélité du client.
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={bm.enabled}
              onCheckedChange={(v) => update("bonus_malus_renouvellement", { enabled: v })}
            />
          </div>
        </CardHeader>
        {bm.enabled && (
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bonus maximum (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={bm.max_bonus}
                  onChange={(e) =>
                    update("bonus_malus_renouvellement", { max_bonus: Math.max(0, Math.min(100, +e.target.value || 0)) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Malus maximum (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={bm.max_malus}
                  onChange={(e) =>
                    update("bonus_malus_renouvellement", { max_malus: Math.max(0, Math.min(100, +e.target.value || 0)) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rôles autorisés</Label>
              <RolesPicker
                idPrefix="bm"
                value={bm.roles}
                onChange={(roles) => update("bonus_malus_renouvellement", { roles })}
              />
            </div>
            <Separator />
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={bm.cumul_with_commercial}
                onCheckedChange={(v) =>
                  update("bonus_malus_renouvellement", { cumul_with_commercial: !!v })
                }
              />
              <div>
                <div className="text-sm font-medium">Cumul avec la réduction commerciale</div>
                <p className="text-xs text-muted-foreground">
                  Si activé, le bonus/malus s'ajoute à la réduction commerciale déjà appliquée.
                </p>
              </div>
            </label>
          </CardContent>
        )}
      </Card>

      {/* Bloc 3 — Workflow d'approbation */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Workflow d'approbation</CardTitle>
                <CardDescription>
                  Force une validation hiérarchique au-delà d'un seuil de valeur assurée (cas sensibles).
                </CardDescription>
              </div>
            </div>
            <Switch checked={a.required} onCheckedChange={(v) => update("approval", { required: v })} />
          </div>
        </CardHeader>
        {a.required && (
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Seuil Réduction Souscription (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={a.threshold_reduction_pct}
                  onChange={(e) =>
                    update("approval", { threshold_reduction_pct: Math.max(0, Math.min(100, +e.target.value || 0)) })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Toute réduction à la souscription au-delà de ce % sera soumise à validation.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Seuil Bonus/Malus Renouvellement (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={a.threshold_bonus_malus_pct}
                  onChange={(e) =>
                    update("approval", { threshold_bonus_malus_pct: Math.max(0, Math.min(100, +e.target.value || 0)) })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Tout bonus ou malus au renouvellement dépassant ce % sera soumis à validation.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rôles validateurs</Label>
              <RolesPicker
                idPrefix="validators"
                value={a.validator_roles}
                onChange={(validator_roles) => update("approval", { validator_roles })}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
