import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileCheck, Send, Download } from "lucide-react";

interface DamageDetail {
  zone: string;
  damageType: string;
  severity: number;
  notes: string;
  imageUrl?: string;
}

interface ClaimData {
  policy_number?: string;
  date?: string;
  type?: string;
  damage?: string;
  vehicle_plate?: string;
  location?: string;
  estimated_cost?: number;
}

interface ClaimSummaryProps {
  claimType: "Auto" | "Habitation" | "Santé";
  ocrData: ClaimData;
  damages: DamageDetail[];
  onSubmit: () => void;
  onDownload: () => void;
}

export const ClaimSummary = ({ 
  claimType, 
  ocrData, 
  damages, 
  onSubmit, 
  onDownload 
}: ClaimSummaryProps) => {
  const totalSeverity = damages.reduce((sum, d) => sum + d.severity, 0);
  const avgSeverity = damages.length > 0 ? (totalSeverity / damages.length).toFixed(1) : "0";

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Résumé de la déclaration
        </CardTitle>
        <CardDescription>
          Vérifiez les informations avant de soumettre
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* OCR Data */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            INFORMATIONS EXTRAITES
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {ocrData.policy_number && (
              <div>
                <p className="text-xs text-muted-foreground">N° Police</p>
                <p className="font-medium">{ocrData.policy_number}</p>
              </div>
            )}
            {ocrData.date && (
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{ocrData.date}</p>
              </div>
            )}
            {ocrData.location && (
              <div>
                <p className="text-xs text-muted-foreground">Lieu</p>
                <p className="font-medium">{ocrData.location}</p>
              </div>
            )}
            {ocrData.vehicle_plate && (
              <div>
                <p className="text-xs text-muted-foreground">Immatriculation</p>
                <p className="font-medium">{ocrData.vehicle_plate}</p>
              </div>
            )}
            {ocrData.estimated_cost && (
              <div>
                <p className="text-xs text-muted-foreground">Montant estimé</p>
                <p className="font-medium text-primary">
                  {ocrData.estimated_cost.toLocaleString()} FCFA
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Damages Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground">
              ZONES ENDOMMAGÉES
            </h3>
            <Badge variant="secondary">
              {damages.length} zone{damages.length > 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="space-y-2">
            {damages.map((damage, index) => (
              <div
                key={index}
                className="p-3 bg-muted/50 rounded-lg space-y-1"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">{damage.zone}</p>
                  <Badge 
                    variant={damage.severity > 3 ? "destructive" : "secondary"}
                  >
                    Gravité {damage.severity}/5
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{damage.damageType}</p>
                {damage.notes && (
                  <p className="text-xs text-muted-foreground italic">
                    {damage.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          {damages.length > 0 && (
            <div className="p-3 bg-primary/5 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Gravité moyenne:</span>{" "}
                <span className="text-primary font-bold">{avgSeverity}/5</span>
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button 
            onClick={onDownload} 
            variant="outline" 
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger le récapitulatif PDF
          </Button>
          <Button 
            onClick={onSubmit} 
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Soumettre la déclaration
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Un conseiller reviendra vers vous sous 24-48h pour validation
        </p>
      </CardContent>
    </Card>
  );
};