import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { ProductFormData } from "../ProductForm";

interface Discount {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  condition: string;
}

interface DiscountsTabProps {
  formData: ProductFormData;
  updateField: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
}

export function DiscountsTab({ formData, updateField }: DiscountsTabProps) {
  const discounts: Discount[] = (formData as any).discounts || [];

  const setDiscounts = (updated: Discount[]) => {
    updateField("discounts" as any, updated);
  };

  const addDiscount = () => {
    setDiscounts([...discounts, { id: crypto.randomUUID(), name: "", type: "percentage", value: 0, condition: "" }]);
  };

  const update = (idx: number, updates: Partial<Discount>) => {
    setDiscounts(discounts.map((d, i) => (i === idx ? { ...d, ...updates } : d)));
  };

  const remove = (idx: number) => {
    setDiscounts(discounts.filter((_, i) => i !== idx));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réductions & Bonus</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configurez les réductions et bonus applicables à ce produit (ex: Bonus Auto -5%, -10%).
        </p>

        {discounts.map((d, idx) => (
          <div key={d.id} className="flex items-start gap-2 p-3 border rounded-md">
            <div className="flex-1 grid gap-2 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">Nom</Label>
                <Input placeholder="Ex: Bonus 1 an" value={d.name} onChange={(e) => update(idx, { name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={d.type} onValueChange={(v) => update(idx, { type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixe (FCFA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valeur</Label>
                <Input type="number" value={d.value} onChange={(e) => update(idx, { value: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Condition</Label>
                <Input placeholder="Ex: Sans sinistre" value={d.condition} onChange={(e) => update(idx, { condition: e.target.value })} />
              </div>
            </div>
            <Button variant="ghost" size="icon" className="mt-5" onClick={() => remove(idx)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addDiscount}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter une réduction
        </Button>
      </CardContent>
    </Card>
  );
}
