import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Lightbulb } from "lucide-react";
import { GuidedSalesState } from "../types";

interface QuickQuoteStepProps {
  state: GuidedSalesState;
  onUpdate: (data: Partial<GuidedSalesState["quickQuote"]>) => void;
}

export const QuickQuoteStep = ({ state, onUpdate }: QuickQuoteStepProps) => {
  const { quickQuote, needsAnalysis } = state;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-foreground">
          <Zap className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Devis Instantané</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Ajustez les paramètres clés pour voir l'impact immédiat sur la prime.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-8">
          {/* Franchise Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Franchise (Reste à charge)</Label>
              <span className="text-lg font-semibold text-primary">{quickQuote.franchise} €</span>
            </div>
            <Slider
              value={[quickQuote.franchise]}
              onValueChange={([v]) => onUpdate({ franchise: v })}
              min={0}
              max={1000}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 € (Cher)</span>
              <span>1000 € (Éco)</span>
            </div>
          </div>

          {/* Value and Bonus/Malus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label className="text-sm">Valeur Assurée</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={quickQuote.insuredValue}
                  onChange={(e) => onUpdate({ insuredValue: Number(e.target.value) })}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  €
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Niveau Bonus/Malus</Label>
              <Select
                value={quickQuote.bonusMalus}
                onValueChange={(v) => onUpdate({ bonusMalus: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bonus_50">Bonus 50</SelectItem>
                  <SelectItem value="bonus_25">Bonus 25</SelectItem>
                  <SelectItem value="bonus_0">Bonus 0</SelectItem>
                  <SelectItem value="malus_25">Malus 25</SelectItem>
                  <SelectItem value="malus_50">Malus 50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
              <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-300">Recommendation IA</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                Au vu du profil "Bon Conducteur", augmenter la franchise à 450€ réduirait la prime de 15% sans risque majeur.
              </p>
              <button className="text-sm text-primary hover:underline mt-2 font-medium">
                Appliquer la suggestion
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
