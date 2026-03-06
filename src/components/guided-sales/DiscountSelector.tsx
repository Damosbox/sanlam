import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Percent } from "lucide-react";

const BNS_OPTIONS = [0, 10, 19, 25, 30, 35];
const COMMERCIAL_OPTIONS = [0, 10, 15, 20, 25, 30, 35, 40];

interface DiscountSelectorProps {
  bns: number;
  commercial: number;
  onBnsChange: (value: number) => void;
  onCommercialChange: (value: number) => void;
}

export const DiscountSelector = ({ bns, commercial, onBnsChange, onCommercialChange }: DiscountSelectorProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Réductions</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">BNS (Bonus No Sinistre)</Label>
            <Select value={String(bns)} onValueChange={(v) => onBnsChange(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BNS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt === 0 ? "Aucun" : `-${opt}%`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Réduction commerciale</Label>
            <Select value={String(commercial)} onValueChange={(v) => onCommercialChange(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMERCIAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt === 0 ? "Aucune" : `-${opt}%`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Apply BNS and commercial discounts to a net premium.
 * Both are applied sequentially on the prime nette.
 */
export const applyDiscounts = (primeNette: number, bns: number, commercial: number) => {
  const afterBns = primeNette * (1 - bns / 100);
  const afterCommercial = afterBns * (1 - commercial / 100);
  return Math.round(afterCommercial);
};
