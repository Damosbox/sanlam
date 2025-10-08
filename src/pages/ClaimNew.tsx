import { useState } from "react";
import { Header } from "@/components/Header";
import { ClaimOCRUploader } from "@/components/ClaimOCRUploader";
import { DamageMap } from "@/components/DamageMap";
import { DamageForm } from "@/components/DamageForm";
import { ClaimSummary } from "@/components/ClaimSummary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ExtractedData {
  policy_number?: string;
  date?: string;
  type?: string;
  damage?: string;
  vehicle_plate?: string;
  location?: string;
  estimated_cost?: number;
  full_text?: string;
}

interface DamageDetail {
  zone: string;
  damageType: string;
  severity: number;
  notes: string;
  imageUrl?: string;
}

const steps = [
  "Scanner le document",
  "Sélectionner les zones",
  "Détails des dommages",
  "Résumé et validation"
];

export default function ClaimNew() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [claimType, setClaimType] = useState<"Auto" | "Habitation" | "Santé">("Auto");
  const [ocrData, setOcrData] = useState<ExtractedData>({});
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [damageDetails, setDamageDetails] = useState<DamageDetail[]>([]);
  const [editingZone, setEditingZone] = useState<string | null>(null);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleOCRDataExtracted = (data: ExtractedData) => {
    setOcrData(data);
    setCurrentStep(1);
  };

  const handleZoneSelect = (zoneId: string, zoneName: string) => {
    if (selectedZones.includes(zoneId)) {
      setSelectedZones(selectedZones.filter(z => z !== zoneId));
      setDamageDetails(damageDetails.filter(d => d.zone !== zoneName));
    } else {
      setSelectedZones([...selectedZones, zoneId]);
      setEditingZone(zoneName);
    }
  };

  const handleDamageDetailSave = (detail: DamageDetail) => {
    const existing = damageDetails.findIndex(d => d.zone === detail.zone);
    if (existing >= 0) {
      const updated = [...damageDetails];
      updated[existing] = detail;
      setDamageDetails(updated);
    } else {
      setDamageDetails([...damageDetails, detail]);
    }
    setEditingZone(null);
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté pour soumettre une déclaration");
        return;
      }

      // Create claim
      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .insert([{
          user_id: user.id,
          policy_id: ocrData.policy_number || 'UNKNOWN',
          claim_type: claimType,
          ocr_data: ocrData as any,
          damages: damageDetails as any,
          status: 'Submitted',
          cost_estimation: ocrData.estimated_cost,
          description: ocrData.damage,
          location: ocrData.location,
          incident_date: ocrData.date ? new Date(ocrData.date).toISOString() : new Date().toISOString()
        }])
        .select()
        .single();

      if (claimError) throw claimError;

      // Create damage zones
      if (claim && damageDetails.length > 0) {
        const zones = damageDetails.map(detail => ({
          claim_id: claim.id,
          zone: detail.zone,
          damage_type: detail.damageType as any,
          severity: detail.severity,
          notes: detail.notes,
          image_url: detail.imageUrl
        }));

        const { error: zonesError } = await supabase
          .from('damage_zones')
          .insert(zones);

        if (zonesError) throw zonesError;
      }

      toast.success("Déclaration soumise avec succès!");
      navigate('/b2c');
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Erreur lors de la soumission"
      );
    }
  };

  const handleDownload = () => {
    toast.info("Génération du PDF en cours...");
    // TODO: Implement PDF generation
  };

  const canProceed = () => {
    if (currentStep === 0) return Object.keys(ocrData).length > 0;
    if (currentStep === 1) return selectedZones.length > 0;
    if (currentStep === 2) return damageDetails.length === selectedZones.length;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Nouvelle déclaration de sinistre
                </h2>
                <div className="text-sm font-medium text-muted-foreground">
                  Étape {currentStep + 1}/{steps.length}
                </div>
              </div>
              
              <Progress value={progress} className="h-2" />
              
              <div className="flex justify-between text-sm">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex-1 text-center ${
                      index <= currentStep 
                        ? "text-primary font-medium" 
                        : "text-muted-foreground"
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 0 && (
            <ClaimOCRUploader
              onDataExtracted={handleOCRDataExtracted}
              claimType={claimType}
            />
          )}

          {currentStep === 1 && (
            <DamageMap
              type={claimType}
              onZoneSelect={handleZoneSelect}
              selectedZones={selectedZones}
            />
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              {editingZone ? (
                <DamageForm
                  zone={editingZone}
                  onSave={handleDamageDetailSave}
                  onCancel={() => setEditingZone(null)}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground mb-4">
                      Sélectionnez une zone pour ajouter ses détails
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedZones.map(zoneId => {
                        const hasDetails = damageDetails.some(d => d.zone === zoneId);
                        return (
                          <Button
                            key={zoneId}
                            variant={hasDetails ? "default" : "outline"}
                            onClick={() => setEditingZone(zoneId)}
                          >
                            {zoneId} {hasDetails && "✓"}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <ClaimSummary
              claimType={claimType}
              ocrData={ocrData}
              damages={damageDetails}
              onSubmit={handleSubmit}
              onDownload={handleDownload}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="flex-1"
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : null}
        </div>
      </main>
    </div>
  );
}