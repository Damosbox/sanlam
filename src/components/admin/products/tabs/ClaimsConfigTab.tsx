import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { ProductFormData } from "../ProductForm";

interface ClaimType {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface ClaimsConfig {
  claimTypes: ClaimType[];
  generalRules: string;
}

interface ClaimsConfigTabProps {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
}

export function ClaimsConfigTab({ formData, updateField }: ClaimsConfigTabProps) {
  const config: ClaimsConfig = (formData as any).claims_config || { claimTypes: [], generalRules: "" };

  const setConfig = (updated: ClaimsConfig) => {
    updateField("claims_config" as any, updated);
  };

  const addClaimType = () => {
    setConfig({
      ...config,
      claimTypes: [...config.claimTypes, { id: crypto.randomUUID(), name: "", description: "", isActive: true }],
    });
  };

  const updateClaimType = (idx: number, updates: Partial<ClaimType>) => {
    setConfig({
      ...config,
      claimTypes: config.claimTypes.map((ct, i) => (i === idx ? { ...ct, ...updates } : ct)),
    });
  };

  const removeClaimType = (idx: number) => {
    setConfig({
      ...config,
      claimTypes: config.claimTypes.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Règles de gestion des sinistres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Règles générales</Label>
            <Textarea
              value={config.generalRules || ""}
              onChange={(e) => setConfig({ ...config, generalRules: e.target.value })}
              placeholder="Décrivez les règles générales de gestion des sinistres pour ce produit..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Types de sinistres autorisés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Définissez les types de sinistres possibles pour ce produit (ex: rachat total, rachat partiel, décès, etc.)
          </p>

          {config.claimTypes.map((ct, idx) => (
            <div key={ct.id} className="flex items-start gap-2 p-3 border rounded-md">
              <div className="flex-1 grid gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nom</Label>
                  <Input placeholder="Ex: Rachat total" value={ct.name} onChange={(e) => updateClaimType(idx, { name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input placeholder="Description..." value={ct.description} onChange={(e) => updateClaimType(idx, { description: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch checked={ct.isActive} onCheckedChange={(v) => updateClaimType(idx, { isActive: v })} />
                  <Label className="text-xs">Actif</Label>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="mt-5" onClick={() => removeClaimType(idx)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addClaimType}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un type
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
